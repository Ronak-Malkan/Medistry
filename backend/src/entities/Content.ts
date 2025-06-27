import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
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

  @OneToMany(() => Medicine, (med) => med.content)
  medicines!: Medicine[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
