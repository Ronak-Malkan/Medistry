import { incomingStockRepository } from '../repositories/incomingStockRepository';
import { medicineRepository } from '../repositories/medicineRepository';
import { IncomingStock } from '../entities/IncomingStock';

export class IncomingStockService {
  async addOrUpdateStock(data: Partial<IncomingStock>, accountId: number) {
    // Uniqueness: (medicine, incoming_date, batch, expiry)
    const existing = await incomingStockRepository.findOne({
      where: {
        medicine: { medicineId: data.medicine?.medicineId },
        incoming_date: data.incoming_date,
        batch_number: data.batch_number,
        expiry_date: data.expiry_date,
        account: { accountId },
      },
    });
    let stock;
    if (existing) {
      // Update existing
      existing.quantity_received += data.quantity_received || 0;
      existing.free_quantity += data.free_quantity || 0;
      stock = await incomingStockRepository.save(existing);
    } else {
      stock = incomingStockRepository.create({
        ...data,
        account: { accountId },
      });
      stock = await incomingStockRepository.save(stock);
    }
    // Increment Medicine.quantityAvailable
    if (data.medicine && (data.quantity_received || data.free_quantity)) {
      const medicine = await medicineRepository.findOne({
        where: { medicineId: data.medicine.medicineId },
      });
      if (medicine) {
        medicine.quantityAvailable +=
          (data.quantity_received || 0) + (data.free_quantity || 0);
        await medicineRepository.save(medicine);
      }
    }
    return stock;
  }

  async findByAccount(accountId: number) {
    return incomingStockRepository.find({ where: { account: { accountId } } });
  }
}
