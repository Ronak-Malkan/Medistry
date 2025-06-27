"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMedicines = listMedicines;
exports.createOrUpdateMedicine = createOrUpdateMedicine;
exports.updateMedicine = updateMedicine;
exports.deleteMedicine = deleteMedicine;
const medicineRepository_1 = require("../repositories/medicineRepository");
const typeorm_1 = require("typeorm");
/**
 * List medicines for an account, optional filter by name substring.
 */
async function listMedicines(accountId, q) {
    const where = { accountId };
    if (q)
        where.name = (0, typeorm_1.ILike)(`%${q}%`);
    return medicineRepository_1.medicineRepository.find({ where });
}
/**
 * Create new stock entry or merge into existing if same batch/date/expiry.
 */
async function createOrUpdateMedicine(accountId, dto) {
    // Parse date strings into Date objects
    const incomingDate = new Date(dto.incomingDate);
    const expiryDate = new Date(dto.expiryDate);
    const existing = await medicineRepository_1.medicineRepository.findOneBy({
        accountId,
        batchNumber: dto.batchNumber,
        incomingDate,
        expiryDate,
    });
    if (existing) {
        existing.quantityAvailable += dto.quantityAvailable;
        return medicineRepository_1.medicineRepository.save(existing);
    }
    const med = medicineRepository_1.medicineRepository.create({
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
    return medicineRepository_1.medicineRepository.save(med);
}
/**
 * Update arbitrary fields on a medicine.
 */
async function updateMedicine(accountId, medicineId, dto) {
    const med = await medicineRepository_1.medicineRepository.findOneBy({ medicineId, accountId });
    if (!med)
        throw new Error('Medicine not found');
    // Merge in plain fields
    if (dto.name)
        med.name = dto.name;
    if (dto.hsn !== undefined)
        med.hsn = dto.hsn;
    if (dto.contentId)
        med.contentId = dto.contentId;
    if (dto.batchNumber)
        med.batchNumber = dto.batchNumber;
    if (dto.incomingDate)
        med.incomingDate = new Date(dto.incomingDate);
    if (dto.expiryDate)
        med.expiryDate = new Date(dto.expiryDate);
    if (dto.unitsPerPack !== undefined)
        med.unitsPerPack = dto.unitsPerPack;
    if (dto.quantityAvailable !== undefined)
        med.quantityAvailable = dto.quantityAvailable;
    if (dto.price)
        med.price = dto.price;
    return medicineRepository_1.medicineRepository.save(med);
}
/**
 * Delete a medicine entry.
 */
async function deleteMedicine(accountId, medicineId) {
    const res = await medicineRepository_1.medicineRepository.delete({ medicineId, accountId });
    if (res.affected === 0)
        throw new Error('Medicine not found');
}
