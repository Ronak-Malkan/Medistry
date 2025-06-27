import { contentRepository } from '../repositories/contentRepository';
import { Content } from '../entities/Content';
import { ILike } from 'typeorm';

/** List all Content entries, or only those whose name matches q. */
export async function listContents(q?: string): Promise<Content[]> {
  if (q) {
    return contentRepository.find({
      where: { name: ILike(`%${q}%`) },
    });
  }
  return contentRepository.find();
}

/** Create a new Content; name must be unique */
export async function createContent(name: string): Promise<Content> {
  const exists = await contentRepository.findOneBy({ name });
  if (exists) {
    throw new Error('Content already exists');
  }
  const content = contentRepository.create({ name });
  return contentRepository.save(content);
}

/** Update an existing Content by ID */
export async function updateContent(
  contentId: number,
  name: string,
): Promise<Content> {
  await contentRepository.update({ contentId }, { name });
  const updated = await contentRepository.findOneBy({ contentId });
  if (!updated) {
    throw new Error('Content not found');
  }
  return updated;
}

/** Delete a Content by ID */
export async function deleteContent(contentId: number): Promise<void> {
  const result = await contentRepository.delete({ contentId });
  if (result.affected === 0) {
    throw new Error('Content not found');
  }
}
