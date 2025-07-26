import { sellingLogRepository } from '../repositories/sellingLogRepository';
import { medicineStockRepository } from '../repositories/medicineStockRepository';
import { SellingLog } from '../entities/SellingLog';
import { Medicine } from '../entities/Medicine';
import { MedicineStock } from '../entities/MedicineStock';
import { AppDataSource } from '../data-source';

interface FlexibleSellingData {
  medicineId?: number;
  medicine_id?: number;
  medicine?: { medicineId: number };
  batchNumber?: string;
  batch_number?: string;
  expiryDate?: Date | string;
  expiry_date?: Date | string;
  quantitySold?: number;
  quantity_sold?: number;
  billId?: number;
  bill_id?: number;
  discountLine?: number;
  discount_line?: number;
  unitPriceInclusiveGst?: number;
  unit_price_inclusive_gst?: number;
}

export class SellingLogService {
  async create(
    data: Partial<SellingLog> & FlexibleSellingData,
    accountId: number,
  ) {
    // Support both camelCase and snake_case for compatibility
    const medicineId =
      data.medicineId ?? data.medicine_id ?? data.medicine?.medicineId;
    const batchNumber = data.batchNumber ?? data.batch_number;
    const expiryDateRaw = data.expiryDate ?? data.expiry_date;
    const quantitySold = data.quantitySold ?? data.quantity_sold;
    const billId = data.billId ?? data.bill_id;
    const discountLine = data.discountLine ?? data.discount_line ?? 0;
    const unitPriceInclusiveGst =
      data.unitPriceInclusiveGst ?? data.unit_price_inclusive_gst;
    // Convert expiryDate to string if needed
    let expiryDate: string | undefined = undefined;
    if (expiryDateRaw) {
      if (typeof expiryDateRaw === 'string') {
        expiryDate = expiryDateRaw.slice(0, 10);
      }
    }
    // Check available quantity in the correct batch
    const stock = await medicineStockRepository.findOne({
      where: {
        medicineId,
        batchNumber,
        expiryDate,
        accountId,
      },
    });
    if (!stock) throw new Error('Medicine batch not found');
    if ((quantitySold || 0) > stock.quantityAvailable) {
      throw new Error('Cannot sell more than available');
    }
    // Decrement
    stock.quantityAvailable -= quantitySold || 0;
    await medicineStockRepository.save(stock);
    // Always get hsn_code from Medicine entity
    let hsn_code = '';
    if (medicineId) {
      const med = await medicineStockRepository.manager.findOne(Medicine, {
        where: { medicineId },
      });
      hsn_code = med?.hsn || '';
    }
    // Create log with mapped fields
    const log = sellingLogRepository.create({
      account: { accountId } as Partial<{ accountId: number }>,
      bill: { bill_id: billId } as Partial<{ bill_id: number }>,
      medicine: { medicineId } as Partial<{ medicineId: number }>,
      batch_number: batchNumber || '',
      quantity_sold: quantitySold || 0,
      discount_line: discountLine,
      unit_price_inclusive_gst: unitPriceInclusiveGst || 0,
      hsn_code,
      expiry_date: expiryDate || '',
    });
    return sellingLogRepository.save(log);
  }

  async findByAccount(accountId: number) {
    return sellingLogRepository.find({
      where: { account: { accountId } },
      relations: ['medicine', 'bill'],
    });
  }

  async findByBillId(billId: number, accountId: number) {
    return sellingLogRepository.find({
      where: {
        bill: { bill_id: billId },
        account: { accountId },
      },
      relations: ['medicine'],
    });
  }

  async update(logId: number, data: Partial<SellingLog>, accountId: number) {
    return await AppDataSource.transaction(async (manager) => {
      // Find the existing log
      const existingLog = await manager.findOne(SellingLog, {
        where: {
          selling_log_id: logId,
          account: { accountId },
        },
        relations: ['medicine'],
      });

      if (!existingLog) {
        throw new Error('Selling log not found');
      }

      // Find the stock entry
      const stock = await manager.findOne(MedicineStock, {
        where: {
          medicineId: existingLog.medicine.medicineId,
          batchNumber: existingLog.batch_number,
          accountId,
        },
      });

      if (!stock) {
        throw new Error('Medicine stock not found');
      }

      // Calculate the difference in quantity
      const oldQuantity = existingLog.quantity_sold;
      const newQuantity = data.quantity_sold || oldQuantity;
      const quantityDifference = newQuantity - oldQuantity;

      // Update stock if quantity changed
      if (quantityDifference !== 0) {
        if (quantityDifference > 0) {
          // Selling more - check if available
          if (quantityDifference > stock.quantityAvailable) {
            throw new Error('Cannot sell more than available');
          }
          stock.quantityAvailable -= quantityDifference;
        } else {
          // Selling less - add back to stock
          stock.quantityAvailable += Math.abs(quantityDifference);
        }
        await manager.save(MedicineStock, stock);
      }

      // Update the log
      const updatedLog = manager.merge(SellingLog, existingLog, {
        quantity_sold: newQuantity,
        unit_price_inclusive_gst:
          data.unit_price_inclusive_gst || existingLog.unit_price_inclusive_gst,
        discount_line: data.discount_line || existingLog.discount_line,
      });

      return await manager.save(SellingLog, updatedLog);
    });
  }

  async delete(logId: number, accountId: number) {
    return await AppDataSource.transaction(async (manager) => {
      // Find the existing log
      const existingLog = await manager.findOne(SellingLog, {
        where: {
          selling_log_id: logId,
          account: { accountId },
        },
        relations: ['medicine'],
      });

      if (!existingLog) {
        throw new Error('Selling log not found');
      }

      // Find the stock entry
      const stock = await manager.findOne(MedicineStock, {
        where: {
          medicineId: existingLog.medicine.medicineId,
          batchNumber: existingLog.batch_number,
          accountId,
        },
      });

      if (stock) {
        // Add back the sold quantity to stock
        stock.quantityAvailable += existingLog.quantity_sold;
        await manager.save(MedicineStock, stock);
      }

      // Delete the log
      await manager.delete(SellingLog, { selling_log_id: logId });
    });
  }
}
