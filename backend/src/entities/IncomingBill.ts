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
import { Provider } from './Provider';

@Entity()
export class IncomingBill {
  @PrimaryGeneratedColumn()
  incoming_bill_id!: number;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => Provider, { nullable: false })
  @JoinColumn({ name: 'provider_id' })
  provider!: Provider;

  @Column({ type: 'varchar', length: 100 })
  invoice_number!: string;

  @Column({ type: 'date' })
  invoice_date!: string;

  @Column({ type: 'enum', enum: ['Paid', 'Remaining'] })
  payment_status!: 'Paid' | 'Remaining';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_total!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  sgst_total!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cgst_total!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
