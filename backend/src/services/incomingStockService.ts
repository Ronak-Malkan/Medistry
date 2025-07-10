import { medicineStockRepository } from '../repositories/medicineStockRepository';
import { incomingStockRepository } from '../repositories/incomingStockRepository';
import { logger } from '../utils/logger';

interface IncomingStockData {
  medicineId: number;
  batchNumber: string;
  incomingDate: string;
  expiryDate: string;
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
        incomingDate:
          typeof data.incomingDate === 'string'
            ? data.incomingDate.slice(0, 10)
            : '',
        expiryDate:
          typeof data.expiryDate === 'string'
            ? data.expiryDate.slice(0, 10)
            : '',
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
        stock.incomingDate = mappedStock.incomingDate;
        stock.expiryDate = mappedStock.expiryDate;
        stock = await medicineStockRepository.save(stock);
      } else {
        stock = medicineStockRepository.create(mappedStock);
        stock = await medicineStockRepository.save(stock);
      }
      // Create IncomingStock record
      const incomingStock = incomingStockRepository.create({
        account: { accountId } as Partial<{ accountId: number }>,
        incomingBill: { incoming_bill_id: data.incomingBillId } as Partial<{
          incoming_bill_id: number;
        }>,
        medicine: { medicineId: data.medicineId } as Partial<{
          medicineId: number;
        }>,
        batch_number: data.batchNumber,
        incoming_date: mappedStock.incomingDate,
        quantity_received: data.quantityReceived,
        unit_cost: data.unitCost || 0,
        discount_line: data.discountLine || 0,
        free_quantity: data.freeQuantity || 0,
        expiry_date: mappedStock.expiryDate,
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
