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

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  date_of_birth?: string;

  @Column({ nullable: true })
  gender?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
