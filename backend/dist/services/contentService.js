"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContents = listContents;
exports.createContent = createContent;
exports.updateContent = updateContent;
exports.deleteContent = deleteContent;
const contentRepository_1 = require("../repositories/contentRepository");
const typeorm_1 = require("typeorm");
/** List all Content entries, or only those whose name matches q. */
async function listContents(q) {
    if (q) {
        return contentRepository_1.contentRepository.find({
            where: { name: (0, typeorm_1.ILike)(`%${q}%`) },
        });
    }
    return contentRepository_1.contentRepository.find();
}
/** Create a new Content; name must be unique */
async function createContent(name) {
    const exists = await contentRepository_1.contentRepository.findOneBy({ name });
    if (exists) {
        throw new Error('Content already exists');
    }
    const content = contentRepository_1.contentRepository.create({ name });
    return contentRepository_1.contentRepository.save(content);
}
/** Update an existing Content by ID */
async function updateContent(contentId, name) {
    await contentRepository_1.contentRepository.update({ contentId }, { name });
    const updated = await contentRepository_1.contentRepository.findOneBy({ contentId });
    if (!updated) {
        throw new Error('Content not found');
    }
    return updated;
}
/** Delete a Content by ID */
async function deleteContent(contentId) {
    const result = await contentRepository_1.contentRepository.delete({ contentId });
    if (result.affected === 0) {
        throw new Error('Content not found');
    }
}
