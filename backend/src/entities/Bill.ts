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
import { Patient } from './Patient';

@Entity()
export class Bill {
  @PrimaryGeneratedColumn()
  bill_id!: number;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => Patient, { nullable: false })
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @Column({ type: 'varchar', length: 255, nullable: true })
  doctor_name!: string;

  @Column({ type: 'date' })
  bill_date!: string;

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
