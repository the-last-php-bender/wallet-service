import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from '../dtos/transaction.dto';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    if (dto.idempotencyKey) {
      const existing = await this.transactionRepo.findOneBy({ idempotencyKey: dto.idempotencyKey });

      if (existing) {
        return existing; // return existing for idempotency
      }
    }

    const transaction = this.transactionRepo.create({
      wallet: dto.wallet,
      amount: dto.amount,
      type: dto.type,
      relatedWalletId: dto.relatedWalletId,
      idempotencyKey: dto.idempotencyKey,
    });

    return this.transactionRepo.save(transaction);
  }

  async getByWallet(walletId: string): Promise<Transaction[]> {
    const transactions = await this.transactionRepo.find({
      where: { wallet: { id: walletId } },
      order: { createdAt: 'DESC' },
    });

    if (!transactions || transactions.length === 0) {
      throw new NotFoundException(`No transactions found for wallet ID: ${walletId}`);
    }

    return transactions;
  }

  async getById(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    return transaction;
  }
}
