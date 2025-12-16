import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateTransactionDto } from '../dtos/transaction.dto';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) { }
async create(dto: CreateTransactionDto, manager?: EntityManager): Promise<{ tx: Transaction; isNew: boolean }> {
  const repo = manager ? manager.getRepository(Transaction) : this.transactionRepo;

  if (dto.idempotencyKey) {
    const existing = await repo.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) {
      return { tx: existing, isNew: false };
    }
  }

  const transaction = repo.create(dto);
  const saved = await repo.save(transaction);
  return { tx: saved, isNew: true }; 
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
