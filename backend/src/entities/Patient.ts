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

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  patient_id!: number;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth!: string;

  @Column({ type: 'enum', enum: ['Male', 'Female', 'Other'], nullable: true })
  gender!: 'Male' | 'Female' | 'Other';

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
