import { AppDataSource } from '../data-source';
import { Medicine } from '../entities/Medicine';
import { Content } from '../entities/Content';
import { MedicineContents } from '../entities/MedicineContents';
import { ILike } from 'typeorm';

export class MedicineService {
  private medicineRepo = AppDataSource.getRepository(Medicine);
  private contentRepo = AppDataSource.getRepository(Content);
  private medicineContentsRepo = AppDataSource.getRepository(MedicineContents);

  async list() {
    return this.medicineRepo.find({ relations: ['contents'] });
  }

  async create(data: Record<string, unknown>) {
    if (!data.name) throw new Error('name is required');
    // Check for duplicate name
    const existing = await this.medicineRepo.findOne({
      where: { name: data.name as string },
    });
    if (existing) throw new Error('Medicine name must be unique');
    const medicine = this.medicineRepo.create({
      name: data.name as string,
      hsn: data.hsn as string,
    });
    const saved = await this.medicineRepo.save(medicine);
    // Optionally add contents
    if (Array.isArray(data.contents) && data.contents.length > 0) {
      const contentEntities = await this.contentRepo.findByIds(
        data.contents as number[],
      );
      if (contentEntities.length !== (data.contents as number[]).length) {
        throw new Error('Some contents not found');
      }
      saved.contents = contentEntities;
      await this.medicineRepo.save(saved);
    }
    return this.medicineRepo.findOne({
      where: { medicineId: saved.medicineId },
      relations: ['contents'],
    });
  }

  async update(medicineId: number, data: Record<string, unknown>) {
    const medicine = await this.medicineRepo.findOne({
      where: { medicineId },
      relations: ['contents'],
    });
    if (!medicine) throw new Error('Medicine not found');
    if (data.name) medicine.name = data.name as string;
    if (data.hsn !== undefined) medicine.hsn = data.hsn as string;
    if (Array.isArray(data.contents)) {
      const contentEntities = await this.contentRepo.findByIds(
        data.contents as number[],
      );
      if (contentEntities.length !== (data.contents as number[]).length) {
        throw new Error('Some contents not found');
      }
      medicine.contents = contentEntities;
    }
    await this.medicineRepo.save(medicine);
    return this.medicineRepo.findOne({
      where: { medicineId },
      relations: ['contents'],
    });
  }

  async delete(medicineId: number) {
    await this.medicineRepo.delete(medicineId);
  }

  async smartSearch(prefix: string, limit?: number) {
    const where = prefix ? { name: ILike(`${prefix}%`) } : {};
    return this.medicineRepo.find({
      where,
      take: limit,
      order: { name: 'ASC' },
      relations: ['contents'],
    });
  }
}
