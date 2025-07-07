import { medicineRepository } from '../repositories/medicineRepository';
import { medicineStockRepository } from '../repositories/medicineStockRepository';
import { Medicine } from '../entities/Medicine';
import { MedicineStock } from '../entities/MedicineStock';
import { ILike, FindOptionsWhere, LessThan, Between } from 'typeorm';
import { accountRepository } from '../repositories/accountRepository';
import { Content } from '../entities/Content';

export interface MedicineStockDTO {
  medicineId: number;
  batchNumber: string;
  incomingDate: string; // ISO date
  expiryDate: string; // ISO date
  unitsPerPack?: number;
  quantityAvailable: number;
  price: string; // decimal as string
}

/**
 * List medicine stock for an account, optional filter by medicine name substring.
 */
export async function listMedicineStock(
  accountId: number,
  q?: string,
): Promise<MedicineStock[]> {
  const where: FindOptionsWhere<MedicineStock> = { accountId };
  // Optionally filter by medicine name
  if (q)
    where['medicine'] = { name: ILike(`%${q}%`) } as FindOptionsWhere<Medicine>;
  return medicineStockRepository.find({ where, relations: ['medicine'] });
}

/**
 * Create new stock entry or merge into existing if same batch/date/expiry.
 */
export async function createOrUpdateMedicineStock(
  accountId: number,
  dto: MedicineStockDTO,
): Promise<MedicineStock> {
  // Parse date strings into Date objects
  const incomingDate = new Date(dto.incomingDate);
  const expiryDate = new Date(dto.expiryDate);

  const existing = await medicineStockRepository.findOneBy({
    accountId,
    medicineId: dto.medicineId,
    batchNumber: dto.batchNumber,
    incomingDate,
    expiryDate,
  });

  if (existing) {
    existing.quantityAvailable += dto.quantityAvailable;
    return medicineStockRepository.save(existing);
  }

  const stock = medicineStockRepository.create({
    medicineId: dto.medicineId,
    batchNumber: dto.batchNumber,
    incomingDate,
    expiryDate,
    unitsPerPack: dto.unitsPerPack,
    quantityAvailable: dto.quantityAvailable,
    price: dto.price,
    accountId,
  });
  return medicineStockRepository.save(stock);
}

/**
 * Update arbitrary fields on a medicine stock entry.
 */
export async function updateMedicineStock(
  accountId: number,
  medicineStockId: number,
  dto: Partial<MedicineStockDTO>,
): Promise<MedicineStock> {
  const stock = await medicineStockRepository.findOneBy({
    medicineStockId,
    accountId,
  });
  if (!stock) throw new Error('Medicine stock not found');
  // Merge in plain fields
  if (dto.medicineId) stock.medicineId = dto.medicineId;
  if (dto.batchNumber) stock.batchNumber = dto.batchNumber;
  if (dto.incomingDate) stock.incomingDate = new Date(dto.incomingDate);
  if (dto.expiryDate) stock.expiryDate = new Date(dto.expiryDate);
  if (dto.unitsPerPack !== undefined) stock.unitsPerPack = dto.unitsPerPack;
  if (dto.quantityAvailable !== undefined)
    stock.quantityAvailable = dto.quantityAvailable;
  if (dto.price) stock.price = dto.price;

  return medicineStockRepository.save(stock);
}

/**
 * Delete a medicine stock entry.
 */
export async function deleteMedicineStock(
  accountId: number,
  medicineStockId: number,
): Promise<void> {
  const res = await medicineStockRepository.delete({
    medicineStockId,
    accountId,
  });
  if (res.affected === 0) throw new Error('Medicine stock not found');
}

export async function getMedicineStockStats(
  accountId: number,
): Promise<number> {
  return medicineStockRepository.count({ where: { accountId } });
}

export async function getLowStockCount(accountId: number): Promise<number> {
  const account = await accountRepository.findOneBy({ accountId });
  if (!account) throw new Error('Account not found');
  const threshold = account.lowStockThreshold || 0;
  return medicineStockRepository.count({
    where: { accountId, quantityAvailable: LessThan(threshold) },
  });
}

export async function getExpiringSoonCount(accountId: number): Promise<number> {
  const account = await accountRepository.findOneBy({ accountId });
  if (!account) throw new Error('Account not found');
  const leadTime = account.expiryAlertLeadTime || 30;
  const now = new Date();
  const soon = new Date(now.getTime() + leadTime * 24 * 60 * 60 * 1000);
  return medicineStockRepository.count({
    where: {
      accountId,
      expiryDate: Between(now, soon),
    },
  });
}

// --- Medicine (master) CRUD ---
export interface MedicineDTO {
  name: string;
  hsn?: string;
  contentIds?: number[];
}

export async function listMedicines(): Promise<Medicine[]> {
  return medicineRepository.find({ relations: ['contents'] });
}

export async function createMedicine(dto: MedicineDTO): Promise<Medicine> {
  const med = medicineRepository.create({
    name: dto.name,
    hsn: dto.hsn,
    contents: dto.contentIds
      ? dto.contentIds.map((id) => ({ contentId: id }))
      : [],
  });
  return medicineRepository.save(med);
}

export async function updateMedicine(
  medicineId: number,
  dto: Partial<MedicineDTO>,
): Promise<Medicine> {
  const med = await medicineRepository.findOne({
    where: { medicineId },
    relations: ['contents'],
  });
  if (!med) throw new Error('Medicine not found');
  if (dto.name) med.name = dto.name;
  if (dto.hsn !== undefined) med.hsn = dto.hsn;
  if (dto.contentIds)
    med.contents = dto.contentIds.map((id) => ({ contentId: id } as Content));
  return medicineRepository.save(med);
}

export async function deleteMedicine(medicineId: number): Promise<void> {
  const res = await medicineRepository.delete({ medicineId });
  if (res.affected === 0) throw new Error('Medicine not found');
}
