import { sellingLogRepository } from '../repositories/sellingLogRepository';
import { medicineRepository } from '../repositories/medicineRepository';
import { SellingLog } from '../entities/SellingLog';

export class SellingLogService {
  async create(data: Partial<SellingLog>, accountId: number) {
    // Check available quantity
    const medicine = await medicineRepository.findOne({
      where: { medicineId: data.medicine?.medicineId },
    });
    if (!medicine) throw new Error('Medicine not found');
    if ((data.quantity_sold || 0) > medicine.quantityAvailable) {
      throw new Error('Cannot sell more than available');
    }
    // Decrement
    medicine.quantityAvailable -= data.quantity_sold || 0;
    await medicineRepository.save(medicine);
    // Create log
    const log = sellingLogRepository.create({
      ...data,
      account: { accountId },
    });
    return sellingLogRepository.save(log);
  }

  async findByAccount(accountId: number) {
    return sellingLogRepository.find({ where: { account: { accountId } } });
  }
}
