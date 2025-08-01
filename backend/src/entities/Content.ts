import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Medicine } from './Medicine';

/**
 * An active ingredient / content for medicines.
 */
@Entity()
export class Content {
  @PrimaryGeneratedColumn()
  contentId!: number;

  @Column({ unique: true })
  name!: string;

  @ManyToMany(() => Medicine, (med) => med.contents)
  medicines!: Medicine[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
