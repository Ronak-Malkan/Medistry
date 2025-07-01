import { incomingBillRepository } from '../repositories/incomingBillRepository';
import { IncomingBill } from '../entities/IncomingBill';

export class IncomingBillService {
  async create(data: Partial<IncomingBill>, accountId: number) {
    const bill = incomingBillRepository.create({
      ...data,
      account: { accountId },
    });
    return incomingBillRepository.save(bill);
  }

  async findByAccount(accountId: number) {
    return incomingBillRepository.find({ where: { account: { accountId } } });
  }

  async findOneById(id: number, accountId: number) {
    return incomingBillRepository.findOne({
      where: { incoming_bill_id: id, account: { accountId } },
    });
  }

  async update(id: number, data: Partial<IncomingBill>, accountId: number) {
    await incomingBillRepository.update(
      { incoming_bill_id: id, account: { accountId } },
      data,
    );
    return this.findOneById(id, accountId);
  }

  async delete(id: number, accountId: number) {
    return incomingBillRepository.delete({
      incoming_bill_id: id,
      account: { accountId },
    });
  }
}
