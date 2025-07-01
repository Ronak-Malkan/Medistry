import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Medicine } from './Medicine';
import { Content } from './Content';

@Entity()
export class MedicineContents {
  @PrimaryColumn()
  medicine_id!: number;

  @PrimaryColumn()
  content_id!: number;

  @ManyToOne(() => Medicine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicine_id' })
  medicine!: Medicine;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content!: Content;
}
