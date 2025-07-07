import { AppDataSource } from '../src/data-source';
import { Medicine } from '../src/entities/Medicine';
import { MedicineStock } from '../src/entities/MedicineStock';
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

  // --- Medicines (master) ---
  const medicineRepo = AppDataSource.getRepository(Medicine);
  const medicineStockRepo = AppDataSource.getRepository(MedicineStock);
  const today = new Date();
  const masterMeds: Medicine[] = [];
  for (let i = 0; i < 5; i++) {
    const med = await medicineRepo.save(
      medicineRepo.create({
        name: `Med ${i + 1}`,
        hsn: `HSN${i + 1}`,
        contents: [contents[i]],
      }),
    );
    masterMeds.push(med);
  }

  // --- Medicine Stock ---
  const medicineStocks: MedicineStock[] = [];
  for (let i = 0; i < 5; i++) {
    const stock = await medicineStockRepo.save(
      medicineStockRepo.create({
        medicineId: masterMeds[i].medicineId,
        batchNumber: `BN${i + 1}`,
        incomingDate: today,
        expiryDate: new Date(
          today.getFullYear() + 1,
          today.getMonth(),
          today.getDate(),
        ),
        unitsPerPack: 10,
        quantityAvailable: 100,
        price: '10.00',
        accountId: ACCOUNT_ID,
      }),
    );
    medicineStocks.push(stock);
  }

  // --- MedicineContents ---
  const medContentsRepo = AppDataSource.getRepository(MedicineContents);
  for (const med of masterMeds) {
    if (med.contents && med.contents.length > 0) {
      const exists = await medContentsRepo.findOneBy({
        medicine_id: med.medicineId,
        content_id: med.contents[0].contentId,
      });
      if (!exists) {
        await medContentsRepo.save(
          medContentsRepo.create({
            medicine_id: med.medicineId,
            content_id: med.contents[0].contentId,
          }),
        );
      }
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
  for (let i = 0; i < 2; i++) {
    await incomingStockRepo.save(
      incomingStockRepo.create({
        account: { accountId: ACCOUNT_ID },
        incomingBill: incomingBills[i],
        medicine: masterMeds[i],
        batch_number: medicineStocks[i].batchNumber,
        incoming_date: medicineStocks[i].incomingDate
          .toISOString()
          .slice(0, 10),
        quantity_received: 10 * (i + 1),
        unit_cost: 18.0 * (i + 1),
        discount_line: 2.0 * (i + 1),
        free_quantity: 0,
        expiry_date: medicineStocks[i].expiryDate.toISOString().slice(0, 10),
      }),
    );
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
    const med = masterMeds[i % masterMeds.length];
    const stock = medicineStocks[i % medicineStocks.length];
    if (med.contents && med.contents.length > 0) {
      const exists = await sellingLogRepo.findOneBy({
        bill: bill,
        medicine: med,
        batch_number: stock.batchNumber,
      });
      if (!exists) {
        await sellingLogRepo.save(
          sellingLogRepo.create({
            bill: bill,
            medicine: med,
            batch_number: stock.batchNumber,
            quantity_sold: 1,
            discount_line: 0,
            unit_price_inclusive_gst: parseFloat(stock.price),
            hsn_code: med.hsn || '',
            expiry_date: stock.expiryDate.toISOString().slice(0, 10),
          }),
        );
      }
    }
  }

  console.log('Demo data seeded for accountId 3!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
