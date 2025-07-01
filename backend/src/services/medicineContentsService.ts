import { medicineContentsRepository } from '../repositories/medicineContentsRepository';

export class MedicineContentsService {
  async add(medicine_id: number, content_id: number) {
    const link = medicineContentsRepository.create({ medicine_id, content_id });
    return medicineContentsRepository.save(link);
  }

  async remove(medicine_id: number, content_id: number) {
    return medicineContentsRepository.delete({ medicine_id, content_id });
  }

  async findByMedicine(medicine_id: number) {
    return medicineContentsRepository.find({ where: { medicine_id } });
  }
}
