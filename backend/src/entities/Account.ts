import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  accountId!: number;

  @Column()
  name!: string;

  @Column()
  drugLicenseNumber!: string;

  @Column()
  address!: string;

  @Column()
  contactEmail!: string;

  @Column()
  contactPhone!: string;

  @Column({ type: 'int', default: 0 })
  lowStockThreshold!: number;

  @Column({ type: 'int', default: 30 })
  expiryAlertLeadTime!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
