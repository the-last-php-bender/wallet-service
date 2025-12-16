import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Transaction } from '../../transaction/entities/transaction.entity';
import { Currency } from 'src/common/constants/enum';

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', enum: Currency, default: Currency.USD })
  currency!: Currency;

  @Column({ type: 'integer', default: 0 })
  balance!: number;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions?: Transaction[];
}
