import { incomingBillRepository } from '../repositories/incomingBillRepository';
import { IncomingBill } from '../entities/IncomingBill';
import { Medicine } from '../entities/Medicine';
import { MedicineStock } from '../entities/MedicineStock';
import { IncomingStock } from '../entities/IncomingStock';
import { AppDataSource } from '../data-source';
import { Provider } from '../entities/Provider';

export interface IncomingBillPayload {
  provider: number | Provider;
  [key: string]: unknown;
}

export interface IncomingBillEntry {
  medicineId?: number;
  name?: string;
  hsn?: string;
  batchNumber: string;
  incomingDate: string;
  expiryDate: string;
  quantity: number;
  price: number;
  discountLine?: number;
  freeQuantity?: number;
}

export class IncomingBillService {
  async create(
    data: { bill: IncomingBillPayload; entries: IncomingBillEntry[] },
    accountId: number,
  ) {
    // Bulk endpoint: expects { bill, entries }
    if (
      !data.bill ||
      !Array.isArray(data.entries) ||
      data.entries.length === 0
    ) {
      throw new Error('bill and entries are required');
    }
    const { bill, entries } = data;
    // Start transaction
    return await AppDataSource.transaction(async (manager) => {
      // Create IncomingBill
      const billEntity = manager.create(IncomingBill, {
        ...bill,
        account: { accountId } as import('../entities/Account').Account,
        provider:
          typeof bill.provider === 'number'
            ? ({ providerId: bill.provider } as Provider)
            : bill.provider,
      });
      const savedBill = await manager.save(IncomingBill, billEntity);
      const stocks: MedicineStock[] = [];
      const logs: IncomingStock[] = [];
      for (const entry of entries) {
        // 1. Medicine: use existing or create new
        let medicine: Medicine;
        if (entry.medicineId) {
          medicine = await manager.findOneByOrFail(Medicine, {
            medicineId: entry.medicineId,
          });
        } else if (entry.name) {
          let foundMed = await manager.findOneBy(Medicine, {
            name: entry.name,
          });
          if (!foundMed) {
            foundMed = manager.create(Medicine, {
              name: entry.name,
              hsn: entry.hsn,
            });
            foundMed = await manager.save(Medicine, foundMed);
          }
          medicine = foundMed;
        } else {
          throw new Error('Each entry must have medicineId or name');
        }
        // 2. MedicineStock: create new batch
        let stock = manager.create(MedicineStock, {
          medicine,
          batchNumber: entry.batchNumber,
          incomingDate: entry.incomingDate,
          expiryDate: entry.expiryDate,
          quantityAvailable: entry.quantity,
          price: entry.price.toString(),
          account: { accountId },
          accountId,
        });
        stock = await manager.save(MedicineStock, stock);
        stocks.push(stock);
        // 3. IncomingStock: log
        let log = manager.create(IncomingStock, {
          account: { accountId },
          incomingBill: savedBill,
          medicine,
          batch_number: entry.batchNumber,
          incoming_date: entry.incomingDate,
          quantity_received: entry.quantity,
          unit_cost: entry.price,
          discount_line: entry.discountLine || 0,
          free_quantity: entry.freeQuantity || 0,
          expiry_date: entry.expiryDate,
        });
        log = await manager.save(IncomingStock, log);
        logs.push(log);
      }
      return { bill: savedBill, stocks, logs };
    });
  }

  async findByAccount(accountId: number) {
    return incomingBillRepository.find({
      where: { account: { accountId } },
      relations: ['provider'],
    });
  }

  async findOneById(id: number, accountId: number) {
    return incomingBillRepository.findOne({
      where: { incoming_bill_id: id, account: { accountId } },
      relations: ['provider'],
    });
  }

  async search(q: string, accountId: number) {
    const queryBuilder = incomingBillRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.provider', 'provider')
      .where('bill.account.accountId = :accountId', { accountId });

    if (q.trim()) {
      queryBuilder.andWhere(
        '(bill.invoice_number ILIKE :q OR provider.name ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    return queryBuilder.orderBy('bill.invoice_date', 'DESC').getMany();
  }

  async update(id: number, data: Partial<IncomingBill>, accountId: number) {
    await incomingBillRepository.update(
      { incoming_bill_id: id, account: { accountId } },
      data,
    );
    return this.findOneById(id, accountId);
  }

  async delete(id: number, accountId: number) {
    // Start transaction to reverse stock additions
    return await AppDataSource.transaction(async (manager) => {
      // 1. Get the incoming bill with related stocks
      const bill = await manager.findOne(IncomingBill, {
        where: { incoming_bill_id: id, account: { accountId } },
        relations: ['account'],
      });

      if (!bill) {
        return { affected: 0 };
      }

      // 2. Get all incoming stocks for this bill
      const incomingStocks = await manager.find(IncomingStock, {
        where: { incomingBill: { incoming_bill_id: id } },
        relations: ['medicine'],
      });

      // 3. Reverse stock additions for each item
      for (const stock of incomingStocks) {
        // Find the corresponding medicine stock
        const medicineStock = await manager.findOne(MedicineStock, {
          where: {
            medicineId: stock.medicine.medicineId,
            batchNumber: stock.batch_number,
            accountId,
          },
        });

        if (medicineStock) {
          // Reduce the available quantity
          medicineStock.quantityAvailable = Math.max(
            0,
            (medicineStock.quantityAvailable || 0) - stock.quantity_received,
          );
          await manager.save(MedicineStock, medicineStock);
        }
      }

      // 4. Delete incoming stocks
      await manager.delete(IncomingStock, {
        incomingBill: { incoming_bill_id: id },
      });

      // 5. Delete the incoming bill
      const result = await manager.delete(IncomingBill, {
        incoming_bill_id: id,
        account: { accountId },
      });

      return result;
    });
  }
}
