import { medicineStockRepository } from '../repositories/medicineStockRepository';
import { incomingStockRepository } from '../repositories/incomingStockRepository';
import { IncomingStock } from '../entities/IncomingStock';
import { MedicineStock } from '../entities/MedicineStock';
import { AppDataSource } from '../data-source';
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
    return incomingStockRepository.find({
      where: { account: { accountId } },
      relations: ['medicine', 'incomingBill'],
    });
  }

  async findByBillId(billId: number, accountId: number) {
    return incomingStockRepository.find({
      where: {
        incomingBill: { incoming_bill_id: billId },
        account: { accountId },
      },
      relations: ['medicine'],
    });
  }

  async update(
    stockId: number,
    data: Partial<IncomingStock>,
    accountId: number,
  ) {
    return await AppDataSource.transaction(async (manager) => {
      // Find the existing incoming stock
      const existingStock = await manager.findOne(IncomingStock, {
        where: {
          incoming_stock_id: stockId,
          account: { accountId },
        },
        relations: ['medicine'],
      });

      if (!existingStock) {
        throw new Error('Incoming stock not found');
      }

      // Find the medicine stock entry
      const medicineStock = await manager.findOne(MedicineStock, {
        where: {
          medicineId: existingStock.medicine.medicineId,
          batchNumber: existingStock.batch_number,
          accountId,
        },
      });

      if (!medicineStock) {
        throw new Error('Medicine stock not found');
      }

      // Calculate the difference in quantity
      const oldQuantity = existingStock.quantity_received;
      const newQuantity = data.quantity_received || oldQuantity;
      const quantityDifference = newQuantity - oldQuantity;

      // Update medicine stock if quantity changed
      if (quantityDifference !== 0) {
        medicineStock.quantityAvailable += quantityDifference;
        await manager.save(MedicineStock, medicineStock);
      }

      // Update the incoming stock
      const updatedStock = manager.merge(IncomingStock, existingStock, {
        quantity_received: newQuantity,
        unit_cost: data.unit_cost || existingStock.unit_cost,
        discount_line: data.discount_line || existingStock.discount_line,
        free_quantity: data.free_quantity || existingStock.free_quantity,
      });

      return await manager.save(IncomingStock, updatedStock);
    });
  }

  async delete(stockId: number, accountId: number) {
    return await AppDataSource.transaction(async (manager) => {
      // Find the existing incoming stock
      const existingStock = await manager.findOne(IncomingStock, {
        where: {
          incoming_stock_id: stockId,
          account: { accountId },
        },
        relations: ['medicine'],
      });

      if (!existingStock) {
        throw new Error('Incoming stock not found');
      }

      // Find the medicine stock entry
      const medicineStock = await manager.findOne(MedicineStock, {
        where: {
          medicineId: existingStock.medicine.medicineId,
          batchNumber: existingStock.batch_number,
          accountId,
        },
      });

      if (medicineStock) {
        // Remove the received quantity from stock
        medicineStock.quantityAvailable = Math.max(
          0,
          medicineStock.quantityAvailable - existingStock.quantity_received,
        );
        await manager.save(MedicineStock, medicineStock);
      }

      // Delete the incoming stock
      await manager.delete(IncomingStock, { incoming_stock_id: stockId });
    });
  }
}
