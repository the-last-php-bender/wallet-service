import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { TransactionType } from 'src/common/constants/enum';


@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'float' })
  amount!: number;

  @Column({ type: 'text', enum: TransactionType })
  type!: TransactionType;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { nullable: false })
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;

  @Column({ nullable: true })
  relatedWalletId?: string;

  @Column({ nullable: true, unique: true })
  idempotencyKey?: string;

  @CreateDateColumn()
  createdAt!: Date;
}

