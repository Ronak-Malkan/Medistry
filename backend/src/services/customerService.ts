import { ILike } from 'typeorm';
import { customerRepository } from '../repositories/customerRepository';
import { Customer } from '../entities/Customer';

interface CustomerInput {
  name: string;
  phone?: string;
  address?: string;
}

/** List customers for this account, optional name-filter */
export async function listCustomers(
  accountId: number,
  q?: string,
): Promise<Customer[]> {
  if (q) {
    return customerRepository.find({
      where: { accountId, name: ILike(`${q}%`) },
    });
  }
  return customerRepository.find({ where: { accountId } });
}

/** Create a new customer */
export async function createCustomer(
  accountId: number,
  data: CustomerInput,
): Promise<Customer> {
  const customer = customerRepository.create({ ...data, accountId });
  return customerRepository.save(customer);
}

/** Update an existing customer's fields */
export async function updateCustomer(
  accountId: number,
  customerId: number,
  data: Partial<CustomerInput>,
): Promise<Customer> {
  const existing = await customerRepository.findOneBy({
    customerId,
    accountId,
  });
  if (!existing) throw new Error('Customer not found');
  Object.assign(existing, data);
  return customerRepository.save(existing);
}

/** Remove a customer */
export async function deleteCustomer(
  accountId: number,
  customerId: number,
): Promise<void> {
  const res = await customerRepository.delete({ customerId, accountId });
  if (res.affected === 0) throw new Error('Customer not found');
}

/** Get customer by ID */
export async function getCustomerById(
  accountId: number,
  customerId: number,
): Promise<Customer | null> {
  return customerRepository.findOneBy({ customerId, accountId });
}

export async function smartSearchCustomers(
  accountId: number,
  q: string,
  limit: number,
): Promise<Customer[]> {
  return customerRepository.find({
    where: { accountId, name: ILike(`${q}%`) },
    take: limit,
  });
}

export async function smartSearchAllCustomers(
  accountId: number,
  q: string,
): Promise<Customer[]> {
  return customerRepository.find({
    where: { accountId, name: ILike(`${q}%`) },
    order: { name: 'ASC' },
  });
}
