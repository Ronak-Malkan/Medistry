import { medicineRepository } from '../repositories/medicineRepository';
import { Medicine } from '../entities/Medicine';
import { ILike, FindOptionsWhere, LessThan, Between } from 'typeorm';
import { accountRepository } from '../repositories/accountRepository';

export interface MedicineDTO {
  name: string;
  hsn?: string;
  contentId: number;
  batchNumber: string;
  incomingDate: string; // ISO date
  expiryDate: string; // ISO date
  unitsPerPack?: number;
  quantityAvailable: number;
  price: string; // decimal as string
}

/**
 * List medicines for an account, optional filter by name substring.
 */
export async function listMedicines(
  accountId: number,
  q?: string,
): Promise<Medicine[]> {
  const where: FindOptionsWhere<Medicine> = { accountId };
  if (q) where.name = ILike(`%${q}%`);
  return medicineRepository.find({ where });
}

/**
 * Create new stock entry or merge into existing if same batch/date/expiry.
 */
export async function createOrUpdateMedicine(
  accountId: number,
  dto: MedicineDTO,
): Promise<Medicine> {
  // Parse date strings into Date objects
  const incomingDate = new Date(dto.incomingDate);
  const expiryDate = new Date(dto.expiryDate);

  const existing = await medicineRepository.findOneBy({
    accountId,
    batchNumber: dto.batchNumber,
    incomingDate,
    expiryDate,
  });

  if (existing) {
    existing.quantityAvailable += dto.quantityAvailable;
    return medicineRepository.save(existing);
  }

  const med = medicineRepository.create({
    name: dto.name,
    hsn: dto.hsn,
    contentId: dto.contentId,
    batchNumber: dto.batchNumber,
    incomingDate,
    expiryDate,
    unitsPerPack: dto.unitsPerPack,
    quantityAvailable: dto.quantityAvailable,
    price: dto.price,
    accountId,
  });
  return medicineRepository.save(med);
}

/**
 * Update arbitrary fields on a medicine.
 */
export async function updateMedicine(
  accountId: number,
  medicineId: number,
  dto: Partial<MedicineDTO>,
): Promise<Medicine> {
  const med = await medicineRepository.findOneBy({ medicineId, accountId });
  if (!med) throw new Error('Medicine not found');
  // Merge in plain fields
  if (dto.name) med.name = dto.name;
  if (dto.hsn !== undefined) med.hsn = dto.hsn;
  if (dto.contentId) med.contentId = dto.contentId;
  if (dto.batchNumber) med.batchNumber = dto.batchNumber;
  if (dto.incomingDate) med.incomingDate = new Date(dto.incomingDate);
  if (dto.expiryDate) med.expiryDate = new Date(dto.expiryDate);
  if (dto.unitsPerPack !== undefined) med.unitsPerPack = dto.unitsPerPack;
  if (dto.quantityAvailable !== undefined)
    med.quantityAvailable = dto.quantityAvailable;
  if (dto.price) med.price = dto.price;

  return medicineRepository.save(med);
}

/**
 * Delete a medicine entry.
 */
export async function deleteMedicine(
  accountId: number,
  medicineId: number,
): Promise<void> {
  const res = await medicineRepository.delete({ medicineId, accountId });
  if (res.affected === 0) throw new Error('Medicine not found');
}

export async function getMedicineStats(accountId: number): Promise<number> {
  return medicineRepository.count({ where: { accountId } });
}

export async function getLowStockCount(accountId: number): Promise<number> {
  const account = await accountRepository.findOneBy({ accountId });
  if (!account) throw new Error('Account not found');
  const threshold = account.lowStockThreshold || 0;
  return medicineRepository.count({
    where: { accountId, quantityAvailable: LessThan(threshold) },
  });
}

export async function getExpiringSoonCount(accountId: number): Promise<number> {
  const account = await accountRepository.findOneBy({ accountId });
  if (!account) throw new Error('Account not found');
  const leadTime = account.expiryAlertLeadTime || 30;
  const now = new Date();
  const soon = new Date(now.getTime() + leadTime * 24 * 60 * 60 * 1000);
  return medicineRepository.count({
    where: {
      accountId,
      expiryDate: Between(now, soon),
    },
  });
}
