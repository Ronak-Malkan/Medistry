import { billRepository } from '../repositories/billRepository';
import { Bill } from '../entities/Bill';
import { Patient } from '../entities/Patient';
import { Medicine } from '../entities/Medicine';
import { MedicineStock } from '../entities/MedicineStock';
import { SellingLog } from '../entities/SellingLog';
import { AppDataSource } from '../data-source';
import { DeleteResult, UpdateResult } from 'typeorm';

export interface BillEntry {
  medicineId: number;
  batchNumber: string;
  quantity: number;
  price: number;
  discountLine?: number;
}

export interface BulkBillPayload {
  bill: Partial<Bill> & { patient_id?: number; patient?: { name: string } };
  entries: BillEntry[];
}

export class BillService {
  async create(
    data: Partial<Bill> & { patient_id?: number },
    accountId: number,
  ) {
    const bill = billRepository.create({
      ...data,
      account: { accountId },
      patient: data.patient_id ? { patient_id: data.patient_id } : undefined,
    });
    return billRepository.save(bill);
  }

  async createBulk(data: BulkBillPayload, accountId: number) {
    if (
      !data.bill ||
      !Array.isArray(data.entries) ||
      data.entries.length === 0
    ) {
      throw new Error('bill and entries are required');
    }
    const { bill, entries } = data;
    return await AppDataSource.transaction(async (manager) => {
      // 1. Patient: find or create
      let patient: Patient;
      if (bill.patient_id) {
        patient = await manager.findOneByOrFail(Patient, {
          patient_id: bill.patient_id,
        });
      } else if (bill.patient && bill.patient.name) {
        const foundPatient = await manager.findOne(Patient, {
          where: { name: bill.patient.name, account: { accountId } },
        });
        if (!foundPatient) {
          patient = manager.create(Patient, {
            ...bill.patient,
            account: { accountId },
          });
          patient = await manager.save(Patient, patient);
        } else {
          patient = foundPatient;
        }
      } else {
        throw new Error('Patient information is required');
      }
      // 2. Create Bill
      const billEntity = manager.create(Bill, {
        ...bill,
        account: { accountId },
        patient: { patient_id: patient.patient_id },
      });
      const savedBill = await manager.save(Bill, billEntity);
      const stocks: MedicineStock[] = [];
      const logs: SellingLog[] = [];
      for (const entry of entries) {
        // 3. Medicine: must exist
        let medicine: Medicine | null = null;
        if (entry.medicineId) {
          medicine = await manager.findOne(Medicine, {
            where: { medicineId: entry.medicineId },
          });
          if (!medicine) {
            throw new Error(`Medicine not found: id=${entry.medicineId}`);
          }
        } else {
          throw new Error('Each entry must have a valid medicineId');
        }
        // 4. Find stock batch
        const stock = await manager.findOne(MedicineStock, {
          where: {
            medicineId: medicine.medicineId,
            batchNumber: entry.batchNumber,
            accountId,
          },
        });
        if (!stock) throw new Error('Medicine batch not found');
        if (entry.quantity > (stock.quantityAvailable ?? 0)) {
          throw new Error('Cannot sell more than available');
        }
        // 5. Decrement stock
        stock.quantityAvailable =
          (stock.quantityAvailable ?? 0) - entry.quantity;
        await manager.save(MedicineStock, stock);
        stocks.push(stock);
        // 6. Create selling log
        let expiryDateValue: string | undefined = undefined;
        if (stock.expiryDate) {
          expiryDateValue = stock.expiryDate;
        }
        const log = manager.create(SellingLog, {
          account: { accountId },
          bill: savedBill,
          medicine,
          batch_number: entry.batchNumber,
          quantity_sold: entry.quantity,
          discount_line: entry.discountLine || 0,
          unit_price_inclusive_gst: entry.price,
          hsn_code: medicine.hsn || '',
          expiry_date: expiryDateValue,
        });
        const savedLog = await manager.save(SellingLog, log);
        logs.push(savedLog);
      }
      return { bill: savedBill, stocks, logs };
    });
  }

  async findByAccount(accountId: number) {
    return billRepository.find({
      where: { account: { accountId } },
      relations: ['patient'],
    });
  }

  async search(q: string, accountId: number) {
    const queryBuilder = billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.patient', 'patient')
      .where('bill.account.accountId = :accountId', { accountId });

    if (q.trim()) {
      queryBuilder.andWhere(
        '(bill.bill_id::text ILIKE :q OR patient.name ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    return queryBuilder.orderBy('bill.bill_date', 'DESC').getMany();
  }

  async findOneById(id: number, accountId: number) {
    return billRepository.findOne({
      where: { bill_id: id, account: { accountId } },
      relations: ['patient'],
    });
  }

  async update(id: number, data: Partial<Bill>, accountId: number) {
    const result: UpdateResult = await billRepository.update(
      { bill_id: id, account: { accountId } },
      data,
    );
    if (result.affected === 0) return null;
    return this.findOneById(id, accountId);
  }

  async delete(id: number, accountId: number) {
    // Start transaction to reverse stock decrements
    return await AppDataSource.transaction(async (manager) => {
      // 1. Get the bill with related selling logs
      const bill = await manager.findOne(Bill, {
        where: { bill_id: id, account: { accountId } },
        relations: ['account'],
      });

      if (!bill) {
        throw new Error('Bill not found');
      }

      // 2. Get all selling logs for this bill
      const sellingLogs = await manager.find(SellingLog, {
        where: { bill: { bill_id: id } },
        relations: ['medicine'],
      });

      // 3. Reverse stock decrements for each item
      for (const log of sellingLogs) {
        // Find the corresponding medicine stock
        const medicineStock = await manager.findOne(MedicineStock, {
          where: {
            medicineId: log.medicine.medicineId,
            batchNumber: log.batch_number,
            accountId,
          },
        });

        if (medicineStock) {
          // Increase the available quantity
          medicineStock.quantityAvailable =
            (medicineStock.quantityAvailable || 0) + log.quantity_sold;
          await manager.save(MedicineStock, medicineStock);
        }
      }

      // 4. Delete selling logs
      await manager.delete(SellingLog, { bill: { bill_id: id } });

      // 5. Delete the bill
      const result: DeleteResult = await manager.delete(Bill, {
        bill_id: id,
        account: { accountId },
      });

      return result;
    });
  }
}
