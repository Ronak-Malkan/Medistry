import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Content } from './Content';
import { Account } from './Account';

@Entity()
export class Medicine {
  @PrimaryGeneratedColumn()
  medicineId!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  hsn?: string;

  @ManyToOne(() => Content, { eager: true })
  @JoinColumn({ name: 'contentId' })
  content!: Content;

  @Column()
  contentId!: number;

  @Column()
  batchNumber!: string;

  @Column({ type: 'date' })
  incomingDate!: Date;

  @Column({ type: 'date' })
  expiryDate!: Date;

  @Column({ type: 'int', nullable: true })
  unitsPerPack?: number;

  @Column({ type: 'int', default: 0 })
  quantityAvailable!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

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
