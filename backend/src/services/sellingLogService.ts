import { sellingLogRepository } from '../repositories/sellingLogRepository';
import { medicineStockRepository } from '../repositories/medicineStockRepository';
import { SellingLog } from '../entities/SellingLog';
import { Medicine } from '../entities/Medicine';

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
    return sellingLogRepository.find({ where: { account: { accountId } } });
  }
}
