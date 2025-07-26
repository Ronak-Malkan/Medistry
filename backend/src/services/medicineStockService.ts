import { medicineStockRepository } from '../repositories/medicineStockRepository';
import { medicineRepository } from '../repositories/medicineRepository';
import { logger } from '../utils/logger';
import { LessThanOrEqual, MoreThan } from 'typeorm';
import { Account } from '../entities/Account';

export class MedicineStockService {
  private stockRepo = medicineStockRepository;
  private medicineRepo = medicineRepository;

  async create(data: Record<string, unknown>) {
    logger.info('MedicineStockService.create • raw data:', data);

    const medicine = await this.medicineRepo.findOne({
      where: { medicineId: data.medicineId as number },
    });
    if (!medicine) throw new Error('Medicine not found');
    // Parse and validate required fields
    const batchNumber = (data.batchNumber || data.batch || '') as string;
    // Always use YYYY-MM-DD strings for incomingDate and expiryDate
    let incomingDate: string;
    let expiryDate: string;
    if (typeof data.incomingDate === 'string') {
      incomingDate = (data.incomingDate as string).slice(0, 10);
    } else {
      incomingDate = new Date().toISOString().slice(0, 10);
    }
    if (typeof data.expiryDate === 'string') {
      expiryDate = (data.expiryDate as string).slice(0, 10);
    } else if (typeof data.expiry === 'string') {
      expiryDate = (data.expiry as string).slice(0, 10);
    } else {
      throw new Error('expiryDate is required');
    }
    // Validate required fields
    if (!data.medicineId || typeof data.medicineId !== 'number')
      throw new Error('medicineId is required');
    if (!batchNumber) throw new Error('batchNumber is required');
    if (data.quantityAvailable === undefined && data.quantity === undefined)
      throw new Error('quantityAvailable is required');
    if (!data.expiryDate && !data.expiry)
      throw new Error('expiryDate is required');
    if (!data.incomingDate) throw new Error('incomingDate is required');
    // Check for existing batch (use strings for query)

    logger.debug('MedicineStockService.create • parsed fields:', {
      medicineId: data.medicineId,
      batchNumber,
      incomingDate,
      expiryDate,
      quantityAvailable: data.quantityAvailable ?? data.quantity,
      price: data.price,
      accountId: data.accountId,
    });
    const existing = await this.stockRepo.findOne({
      where: {
        medicineId: data.medicineId as number,
        accountId: data.accountId as number,
        batchNumber,
        incomingDate,
        expiryDate,
      },
    });
    logger.info('MedicineStockService.create • existing batch:', existing);
    if (existing) {
      existing.quantityAvailable += (data.quantityAvailable ??
        data.quantity ??
        0) as number;
      existing.price = (data.price ?? '0.00') as string;
      existing.incomingDate = incomingDate;
      existing.expiryDate = expiryDate;
      await this.stockRepo.save(existing);
      // Reload to get correct serialization
      const saved = await this.stockRepo.findOneBy({
        medicineStockId: existing.medicineStockId,
      });
      return {
        ...saved,
        incomingDate: saved?.incomingDate,
        expiryDate: saved?.expiryDate,
      };
    }
    const stock = this.stockRepo.create({
      medicineId: data.medicineId as number,
      accountId: data.accountId as number,
      batchNumber,
      incomingDate,
      expiryDate,
      unitsPerPack: data.unitsPerPack as number | undefined,
      quantityAvailable: (data.quantityAvailable ??
        data.quantity ??
        0) as number,
      price: (data.price ?? '0.00') as string,
    });
    logger.info('MedicineStockService.create • new stock entity:', stock);

    await this.stockRepo.save(stock);
    // Reload to get correct serialization
    const saved = await this.stockRepo.findOneBy({
      medicineStockId: stock.medicineStockId,
    });
    return {
      ...saved,
      incomingDate: saved?.incomingDate,
      expiryDate: saved?.expiryDate,
    };
  }

  async update(id: number, data: Record<string, unknown>, accountId: number) {
    const stock = await this.stockRepo.findOne({
      where: { medicineStockId: id, accountId },
    });
    if (!stock) return null;
    if (data.incomingDate)
      stock.incomingDate = (data.incomingDate as string).slice(0, 10);
    if (data.expiryDate)
      stock.expiryDate = (data.expiryDate as string).slice(0, 10);
    Object.assign(stock, data);
    await this.stockRepo.save(stock);
    return {
      ...stock,
      incomingDate: stock.incomingDate,
      expiryDate: stock.expiryDate,
    };
  }

  async delete(id: number, accountId: number) {
    const stock = await this.stockRepo.findOne({
      where: { medicineStockId: id, accountId },
    });
    if (!stock) return false;
    await this.stockRepo.remove(stock);
    return true;
  }

  async search(prefix: string, accountId: number, limit?: number) {
    // Find medicines matching prefix and account
    const medicines = await this.medicineRepo
      .createQueryBuilder('medicine')
      .where('medicine.name ILIKE :prefix', { prefix: `${prefix}%` })
      .getMany();
    if (!medicines.length) return [];
    const medicineIds = medicines.map((m) => m.medicineId);
    // Find in-stock batches for those medicines
    const qb = this.stockRepo
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.medicine', 'medicine')
      .where('stock.medicineId IN (:...medicineIds)', { medicineIds })
      .andWhere('stock.accountId = :accountId', { accountId })
      .andWhere('stock.quantityAvailable > 0')
      .orderBy('stock.expiryDate', 'ASC');
    if (limit) qb.limit(limit);
    const stocks = await qb.getMany();
    // Attach medicine info, return date fields as strings
    return stocks.map((s) => ({
      medicineStockId: s.medicineStockId,
      medicine: {
        medicineId: s.medicine.medicineId,
        name: s.medicine.name,
      },
      batchNumber: s.batchNumber,
      expiryDate: s.expiryDate,
      incomingDate: s.incomingDate,
      quantityAvailable: s.quantityAvailable,
      price: s.price,
      unitsPerPack: s.unitsPerPack,
    }));
  }

  async getLowStockCount(accountId: number): Promise<number> {
    // Get account info to determine low stock threshold
    const account = await this.stockRepo.manager.findOne(Account, {
      where: { accountId },
    });
    const lowStockThreshold = account?.lowStockThreshold || 10;

    const count = await this.stockRepo.count({
      where: {
        accountId,
        quantityAvailable: LessThanOrEqual(lowStockThreshold),
      },
    });

    return count;
  }

  async getExpiringSoonCount(accountId: number): Promise<number> {
    // Get account info to determine expiry alert lead time
    const account = await this.stockRepo.manager.findOne(Account, {
      where: { accountId },
    });
    const expiryAlertLeadTime = account?.expiryAlertLeadTime || 30;

    // Calculate the date threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + expiryAlertLeadTime);

    const count = await this.stockRepo.count({
      where: {
        accountId,
        expiryDate: LessThanOrEqual(thresholdDate.toISOString().slice(0, 10)),
        quantityAvailable: MoreThan(0), // Only count items that have stock
      },
    });

    return count;
  }
}
