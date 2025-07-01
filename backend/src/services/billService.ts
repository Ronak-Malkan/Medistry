import { billRepository } from '../repositories/billRepository';
import { Bill } from '../entities/Bill';

export class BillService {
  async create(
    data: Partial<Bill> & { patient_id?: number },
    accountId: number,
  ) {
    console.log('BillService.create - incoming data:', data);
    const bill = billRepository.create({
      ...data,
      account: { accountId },
      patient: data.patient_id ? { patient_id: data.patient_id } : undefined,
    });
    console.log('BillService.create - constructed bill:', bill);
    try {
      const saved = await billRepository.save(bill);
      console.log('BillService.create - saved bill:', saved);
      return saved;
    } catch (err) {
      console.error('BillService.create - error saving bill:', err);
      throw err;
    }
  }

  async findByAccount(accountId: number) {
    return billRepository.find({ where: { account: { accountId } } });
  }

  async findOneById(id: number, accountId: number) {
    return billRepository.findOne({
      where: { bill_id: id, account: { accountId } },
    });
  }

  async update(id: number, data: Partial<Bill>, accountId: number) {
    await billRepository.update({ bill_id: id, account: { accountId } }, data);
    return this.findOneById(id, accountId);
  }

  async delete(id: number, accountId: number) {
    return billRepository.delete({ bill_id: id, account: { accountId } });
  }
}
