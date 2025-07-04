import { AppDataSource } from '../src/data-source';
import { Medicine } from '../src/entities/Medicine';
import { Content } from '../src/entities/Content';
import { MedicineContents } from '../src/entities/MedicineContents';
import { Patient } from '../src/entities/Patient';
import { Provider } from '../src/entities/Provider';
import { Bill } from '../src/entities/Bill';
import { SellingLog } from '../src/entities/SellingLog';
import { IncomingBill } from '../src/entities/IncomingBill';
import { IncomingStock } from '../src/entities/IncomingStock';
import { faker } from '@faker-js/faker';

const ACCOUNT_ID = 3;
const USER_ID = 4;

async function seed() {
  await AppDataSource.initialize();

  // --- Contents ---
  const contentsData = [
    { name: 'Paracetamol' },
    { name: 'Amoxicillin' },
    { name: 'Ibuprofen' },
    { name: 'Ciprofloxacin' },
    { name: 'Metformin' },
    { name: 'Cetirizine' },
    { name: 'Azithromycin' },
    { name: 'Atorvastatin' },
    { name: 'Omeprazole' },
    { name: 'Amlodipine' },
  ];
  const contentRepo = AppDataSource.getRepository(Content);
  const contents: Content[] = [];
  for (const c of contentsData) {
    let content = await contentRepo.findOneBy({ name: c.name });
    if (!content) {
      content = await contentRepo.save(contentRepo.create(c));
    }
    contents.push(content);
  }

  // --- Medicines ---
  const medicineRepo = AppDataSource.getRepository(Medicine);
  const today = new Date();
  const medicinesData = [
    // Expiring soon, low stock
    {
      name: 'Crocin 500',
      hsn: '3004',
      contentId: contents[0].contentId,
      batchNumber: 'A1',
      incomingDate: new Date(today.getFullYear(), today.getMonth() - 2, 1),
      expiryDate: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 10,
      ),
      unitsPerPack: 10,
      quantityAvailable: 5,
      price: '20.00',
      accountId: ACCOUNT_ID,
    },
    // High stock, long expiry
    {
      name: 'Amoxil 250',
      hsn: '3003',
      contentId: contents[1].contentId,
      batchNumber: 'B2',
      incomingDate: new Date(today.getFullYear(), today.getMonth() - 1, 10),
      expiryDate: new Date(today.getFullYear(), today.getMonth() + 12, 1),
      unitsPerPack: 20,
      quantityAvailable: 200,
      price: '120.00',
      accountId: ACCOUNT_ID,
    },
    // Normal stock, expiring in 3 months
    {
      name: 'Ibugesic Plus',
      hsn: '3002',
      contentId: contents[2].contentId,
      batchNumber: 'C3',
      incomingDate: new Date(today.getFullYear(), today.getMonth() - 3, 5),
      expiryDate: new Date(today.getFullYear(), today.getMonth() + 3, 1),
      unitsPerPack: 15,
      quantityAvailable: 50,
      price: '45.00',
      accountId: ACCOUNT_ID,
    },
    // Expired
    {
      name: 'Ciplox 500',
      hsn: '3005',
      contentId: contents[3].contentId,
      batchNumber: 'D4',
      incomingDate: new Date(today.getFullYear(), today.getMonth() - 12, 1),
      expiryDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      unitsPerPack: 10,
      quantityAvailable: 0,
      price: '80.00',
      accountId: ACCOUNT_ID,
    },
    // High stock, expiring soon
    {
      name: 'Cetirizine 10mg',
      hsn: '3006',
      contentId: contents[5].contentId,
      batchNumber: 'E5',
      incomingDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      expiryDate: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 5,
      ),
      unitsPerPack: 30,
      quantityAvailable: 100,
      price: '60.00',
      accountId: ACCOUNT_ID,
    },
  ];
  const medicines: Medicine[] = [];
  for (const m of medicinesData) {
    let medicine = await medicineRepo.findOneBy({
      name: m.name,
      batchNumber: m.batchNumber,
      accountId: m.accountId,
    });
    if (!medicine) {
      medicine = await medicineRepo.save(medicineRepo.create(m));
    }
    medicines.push(medicine);
  }

  // --- MedicineContents ---
  const medContentsRepo = AppDataSource.getRepository(MedicineContents);
  for (const med of medicines) {
    const exists = await medContentsRepo.findOneBy({
      medicine_id: med.medicineId,
      content_id: med.contentId,
    });
    if (!exists) {
      await medContentsRepo.save(
        medContentsRepo.create({
          medicine_id: med.medicineId,
          content_id: med.contentId,
        }),
      );
    }
  }

  // --- Patients ---
  const patientRepo = AppDataSource.getRepository(Patient);
  const patientsData = Array.from({ length: 5 }).map(() =>
    patientRepo.create({
      account: { accountId: ACCOUNT_ID },
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      date_of_birth: faker.date
        .birthdate({ min: 1950, max: 2015, mode: 'year' })
        .toISOString()
        .slice(0, 10),
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
    }),
  );
  const patients: Patient[] = [];
  for (const p of patientsData) {
    let patient = await patientRepo.findOneBy({
      name: p.name,
      phone: p.phone,
      account: { accountId: ACCOUNT_ID },
    });
    if (!patient) {
      patient = await patientRepo.save(p);
    }
    patients.push(patient);
  }

  // --- Providers ---
  const providerRepo = AppDataSource.getRepository(Provider);
  const providersData = [
    providerRepo.create({
      name: 'Apollo Distributors',
      contactEmail: 'contact@apollo.com',
      contactPhone: '9123456789',
      accountId: ACCOUNT_ID,
    }),
    providerRepo.create({
      name: 'MedPlus Suppliers',
      contactEmail: 'info@medplus.com',
      contactPhone: '9876543210',
      accountId: ACCOUNT_ID,
    }),
  ];
  const providers: Provider[] = [];
  for (const p of providersData) {
    let provider = await providerRepo.findOneBy({
      name: p.name,
      accountId: p.accountId,
    });
    if (!provider) {
      provider = await providerRepo.save(p);
    }
    providers.push(provider);
  }

  // --- IncomingBills ---
  const incomingBillRepo = AppDataSource.getRepository(IncomingBill);
  const incomingBillsData = [
    incomingBillRepo.create({
      account: { accountId: ACCOUNT_ID },
      provider: providers[0],
      invoice_number: 'INV-1001',
      invoice_date: faker.date.recent({ days: 30 }).toISOString().slice(0, 10),
      payment_status: 'Paid',
      discount_total: 10,
      sgst_total: 5,
      cgst_total: 5,
      total_amount: 500,
    }),
    incomingBillRepo.create({
      account: { accountId: ACCOUNT_ID },
      provider: providers[1],
      invoice_number: 'INV-1002',
      invoice_date: faker.date.recent({ days: 60 }).toISOString().slice(0, 10),
      payment_status: 'Remaining',
      discount_total: 0,
      sgst_total: 8,
      cgst_total: 8,
      total_amount: 800,
    }),
  ];
  const incomingBills: IncomingBill[] = [];
  for (const ib of incomingBillsData) {
    let incomingBill = await incomingBillRepo.findOneBy({
      invoice_number: ib.invoice_number,
      account: { accountId: ACCOUNT_ID },
    });
    if (!incomingBill) {
      incomingBill = await incomingBillRepo.save(ib);
    }
    incomingBills.push(incomingBill);
  }

  // --- IncomingStocks ---
  const incomingStockRepo = AppDataSource.getRepository(IncomingStock);
  const incomingStocksData = [
    incomingStockRepo.create({
      account: { accountId: ACCOUNT_ID },
      incomingBill: incomingBills[0],
      medicine: medicines[0],
      batch_number: medicines[0].batchNumber,
      incoming_date: medicines[0].incomingDate.toISOString().slice(0, 10),
      hsn_code: medicines[0].hsn,
      quantity_received: 10,
      unit_cost: 18.0,
      discount_line: 2.0,
      free_quantity: 0,
      expiry_date: medicines[0].expiryDate.toISOString().slice(0, 10),
    }),
    incomingStockRepo.create({
      account: { accountId: ACCOUNT_ID },
      incomingBill: incomingBills[1],
      medicine: medicines[1],
      batch_number: medicines[1].batchNumber,
      incoming_date: medicines[1].incomingDate.toISOString().slice(0, 10),
      hsn_code: medicines[1].hsn,
      quantity_received: 100,
      unit_cost: 100.0,
      discount_line: 10.0,
      free_quantity: 5,
      expiry_date: medicines[1].expiryDate.toISOString().slice(0, 10),
    }),
  ];
  for (const isd of incomingStocksData) {
    const exists = await incomingStockRepo.findOneBy({
      batch_number: isd.batch_number,
      incoming_date: isd.incoming_date,
      account: { accountId: ACCOUNT_ID },
    });
    if (!exists) {
      await incomingStockRepo.save(isd);
    }
  }

  // --- Bills ---
  const billRepo = AppDataSource.getRepository(Bill);
  const billsData = patients.map((patient, i) =>
    billRepo.create({
      account: { accountId: ACCOUNT_ID },
      patient,
      doctor_name: faker.person.fullName(),
      bill_date: faker.date.recent({ days: 10 }).toISOString().slice(0, 10),
      discount_total: faker.number.float({
        min: 0,
        max: 20,
        fractionDigits: 2,
      }),
      sgst_total: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
      cgst_total: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
      total_amount: faker.number.float({
        min: 100,
        max: 1000,
        fractionDigits: 2,
      }),
    }),
  );
  const bills: Bill[] = [];
  for (const b of billsData) {
    let bill = await billRepo.findOneBy({
      bill_date: b.bill_date,
      patient: b.patient,
      account: { accountId: ACCOUNT_ID },
    });
    if (!bill) {
      bill = await billRepo.save(b);
    }
    bills.push(bill);
  }

  // --- SellingLogs ---
  const sellingLogRepo = AppDataSource.getRepository(SellingLog);
  for (const [i, bill] of bills.entries()) {
    const med = medicines[i % medicines.length];
    const exists = await sellingLogRepo.findOneBy({
      bill: bill,
      medicine: med,
      account: { accountId: ACCOUNT_ID },
    });
    if (!exists) {
      await sellingLogRepo.save(
        sellingLogRepo.create({
          account: { accountId: ACCOUNT_ID },
          bill,
          medicine: med,
          batch_number: med.batchNumber,
          quantity_sold: faker.number.int({ min: 1, max: 10 }),
          discount_line: faker.number.float({
            min: 0,
            max: 5,
            fractionDigits: 2,
          }),
          unit_price_inclusive_gst: parseFloat(med.price),
          hsn_code: med.hsn || '',
          expiry_date: med.expiryDate.toISOString().slice(0, 10),
        }),
      );
    }
  }

  console.log('Demo data seeded for accountId 3!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
