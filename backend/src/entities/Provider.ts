import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './Account';

@Entity()
export class Provider {
  @PrimaryGeneratedColumn()
  providerId!: number;

  @Column()
  name!: string;

  @Column()
  contactEmail!: string;

  @Column()
  contactPhone!: string;

  // scope to company
  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column()
  accountId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
