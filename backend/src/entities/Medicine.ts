import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Content } from './Content';

@Entity()
export class Medicine {
  @PrimaryGeneratedColumn()
  medicineId!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  hsn?: string;

  @ManyToMany(() => Content, { eager: true })
  @JoinTable({
    name: 'MedicineContents',
    joinColumn: { name: 'medicine_id', referencedColumnName: 'medicineId' },
    inverseJoinColumn: {
      name: 'content_id',
      referencedColumnName: 'contentId',
    },
  })
  contents?: Content[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
