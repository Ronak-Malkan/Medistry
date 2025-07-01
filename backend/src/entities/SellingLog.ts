import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Account } from './Account';
import { Bill } from './Bill';
import { Medicine } from './Medicine';

@Entity()
export class SellingLog {
  @PrimaryGeneratedColumn()
  selling_log_id!: number;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => Bill, { nullable: false })
  @JoinColumn({ name: 'bill_id' })
  bill!: Bill;

  @ManyToOne(() => Medicine, { nullable: false })
  @JoinColumn({ name: 'medicine_id' })
  medicine!: Medicine;

  @Column({ type: 'varchar', length: 100 })
  batch_number!: string;

  @Column({ type: 'int' })
  quantity_sold!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_line!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price_inclusive_gst!: number;

  @Column({ type: 'varchar', length: 50 })
  hsn_code!: string;

  @Column({ type: 'date' })
  expiry_date!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
