import { medicineStockRepository } from '../repositories/medicineStockRepository';
import { incomingStockRepository } from '../repositories/incomingStockRepository';
import { logger } from '../utils/logger';

interface IncomingStockData {
  medicineId: number;
  batchNumber: string;
  incomingDate: Date;
  expiryDate: Date;
  quantityReceived: number;
  unitCost?: number;
  incomingBillId: number;
  discountLine?: number;
  freeQuantity?: number;
}

export class IncomingStockService {
  async addOrUpdateStock(data: IncomingStockData, accountId: number) {
    try {
      logger.info('IncomingStockService.addOrUpdateStock - data:', data);
      // Map DTO fields
      const mappedStock = {
        medicineId: data.medicineId,
        batchNumber: data.batchNumber,
        incomingDate: data.incomingDate,
        expiryDate: data.expiryDate,
        quantityAvailable: data.quantityReceived,
        price: data.unitCost?.toString(),
        accountId,
      };
      // Uniqueness: (medicine, incoming_date, batch, expiry)
      let stock = await medicineStockRepository.findOne({
        where: {
          medicineId: mappedStock.medicineId,
          incomingDate: mappedStock.incomingDate,
          batchNumber: mappedStock.batchNumber,
          expiryDate: mappedStock.expiryDate,
          accountId,
        },
      });
      logger.info('Existing stock found:', stock);
      if (stock) {
        stock.quantityAvailable += mappedStock.quantityAvailable || 0;
        stock.price = mappedStock.price || stock.price;
        stock = await medicineStockRepository.save(stock);
      } else {
        stock = medicineStockRepository.create(mappedStock);
        stock = await medicineStockRepository.save(stock);
      }
      // Create IncomingStock record
      // Ensure incomingDate and expiryDate are Date objects
      let incomingDateObj = data.incomingDate;
      if (typeof incomingDateObj === 'string') {
        incomingDateObj = new Date(incomingDateObj);
      }
      let expiryDateObj = data.expiryDate;
      if (typeof expiryDateObj === 'string') {
        expiryDateObj = new Date(expiryDateObj);
      }
      const incomingStock = incomingStockRepository.create({
        account: { accountId } as Partial<{ accountId: number }>,
        incomingBill: { incoming_bill_id: data.incomingBillId } as Partial<{
          incoming_bill_id: number;
        }>,
        medicine: { medicineId: data.medicineId } as Partial<{
          medicineId: number;
        }>,
        batch_number: data.batchNumber,
        incoming_date: incomingDateObj.toISOString().split('T')[0],
        quantity_received: data.quantityReceived,
        unit_cost: data.unitCost || 0,
        discount_line: data.discountLine || 0,
        free_quantity: data.freeQuantity || 0,
        expiry_date: expiryDateObj.toISOString().split('T')[0],
      });
      await incomingStockRepository.save(incomingStock);
      logger.info('Returning stock:', stock);
      return stock;
    } catch (err) {
      logger.error('IncomingStockService.addOrUpdateStock error:', err);
      throw err;
    }
  }

  async findByAccount(accountId: number) {
    return medicineStockRepository.find({
      where: { accountId },
      relations: ['medicine'],
    });
  }
}
