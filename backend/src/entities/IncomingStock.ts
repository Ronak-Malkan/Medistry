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
import { IncomingBill } from './IncomingBill';
import { Medicine } from './Medicine';

@Entity()
export class IncomingStock {
  @PrimaryGeneratedColumn()
  incoming_stock_id!: number;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => IncomingBill, { nullable: false })
  @JoinColumn({ name: 'incoming_bill_id' })
  incomingBill!: IncomingBill;

  @ManyToOne(() => Medicine, { nullable: false })
  @JoinColumn({ name: 'medicine_id' })
  medicine!: Medicine;

  @Column({ type: 'varchar', length: 100 })
  batch_number!: string;

  @Column({ type: 'date' })
  incoming_date!: string;

  @Column({ type: 'int' })
  quantity_received!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_cost!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_line!: number;

  @Column({ type: 'int', default: 0 })
  free_quantity!: number;

  @Column({ type: 'date' })
  expiry_date!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
