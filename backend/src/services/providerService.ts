import { ILike } from 'typeorm';
import { providerRepository } from '../repositories/providerRepository';
import { Provider } from '../entities/Provider';

interface ProviderInput {
  name: string;
  contactEmail: string;
  contactPhone: string;
}

/** List providers for this account, optional name‐filter */
export async function listProviders(
  accountId: number,
  q?: string,
): Promise<Provider[]> {
  if (q) {
    return providerRepository.find({
      where: { accountId, name: ILike(`%${q}%`) },
    });
  }
  return providerRepository.find({ where: { accountId } });
}

/** Create a new provider under this account */
export async function createProvider(
  accountId: number,
  data: ProviderInput,
): Promise<Provider> {
  const prov = providerRepository.create({ ...data, accountId });
  return providerRepository.save(prov);
}

/** Update an existing provider’s fields */
export async function updateProvider(
  accountId: number,
  providerId: number,
  data: Partial<ProviderInput>,
): Promise<Provider> {
  const existing = await providerRepository.findOneBy({
    providerId,
    accountId,
  });
  if (!existing) throw new Error('Provider not found');
  Object.assign(existing, data);
  return providerRepository.save(existing);
}

/** Remove a provider */
export async function deleteProvider(
  accountId: number,
  providerId: number,
): Promise<void> {
  const res = await providerRepository.delete({ providerId, accountId });
  if (res.affected === 0) throw new Error('Provider not found');
}

export async function smartSearchProviders(
  accountId: number,
  q: string,
  limit: number,
): Promise<Provider[]> {
  return providerRepository.find({
    where: { accountId, name: ILike(`%${q}%`) },
    take: limit,
  });
}
