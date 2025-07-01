import { patientRepository } from '../repositories/patientRepository';
import { Patient } from '../entities/Patient';

export class PatientService {
  async create(data: Partial<Patient>, accountId: number) {
    const patient = patientRepository.create({
      ...data,
      account: { accountId },
    });
    return patientRepository.save(patient);
  }

  async findByAccount(accountId: number) {
    return patientRepository.find({ where: { account: { accountId } } });
  }

  async findOneById(id: number, accountId: number) {
    return patientRepository.findOne({
      where: { patient_id: id, account: { accountId } },
    });
  }

  async update(id: number, data: Partial<Patient>, accountId: number) {
    await patientRepository.update(
      { patient_id: id, account: { accountId } },
      data,
    );
    return this.findOneById(id, accountId);
  }

  async delete(id: number, accountId: number) {
    return patientRepository.delete({ patient_id: id, account: { accountId } });
  }
}
