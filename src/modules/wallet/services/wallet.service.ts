import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { TransactionService } from 'src/modules/transaction/services/transaction.service';
import { Currency, TransactionType } from 'src/common/constants/enum';
import { Transaction } from 'src/modules/transaction/entities/transaction.entity';
import { CurrencyConverter } from 'src/common/util/currencyConversion.util';
import { FundWalletDto } from '../dtos/wallet.dto';

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,
        private readonly transactionService: TransactionService,
        private readonly dataSource: DataSource,
    ) { }

    async createWallet(): Promise<Wallet> {
        const wallet = this.walletRepo.create({
            balance: 0,
            currency: Currency.USD,
        });
        return await this.walletRepo.save(wallet);
    }
   async fundWallet(walletId: string, dto: FundWalletDto): Promise<any> {
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');

    return await this.dataSource.transaction(async (manager) => {
        // 1. Check/Create Transaction
        const { isNew } = await this.transactionService.create({
            wallet: { id: walletId } as any,
            amount: CurrencyConverter.centsToUsd(dto.amount),
            type: TransactionType.FUND,
            idempotencyKey: dto.idempotencyKey,
        }, manager);

        if (!isNew) {
            const existingWallet:any  = await manager.findOne(Wallet, { where: { id: walletId } });
            return {
                ...existingWallet,
                balance: CurrencyConverter.centsToUsd(existingWallet.balance),
                message: 'Duplicate transaction detected. Balance unchanged.'
            };
        }

        // 2. If it is new, proceed to lock and update
        const wallet = await manager.findOne(Wallet, {
            where: { id: walletId },
            lock: { mode: 'pessimistic_write' }
        });

        if (!wallet) throw new NotFoundException('Wallet not found');

        // 3. Update Balance
        wallet.balance += dto.amount;
        await manager.save(wallet);

        return {
            ...wallet,
            balance: CurrencyConverter.centsToUsd(wallet.balance)
        };
    });
}
    async transferFunds(senderId: string, receiverId: string, amount: number, idempotencyKey: string): Promise<any> {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');
        if (senderId === receiverId) throw new BadRequestException('Self-transfer not allowed');

        return await this.dataSource.transaction(async (manager) => {
            // 1. Lock both wallets (Order by ID to prevent Deadlocks)
            const ids = [senderId, receiverId].sort();
            const wallets = await manager.find(Wallet, {
                where: { id: (ids as any) },
                lock: { mode: 'pessimistic_write' }
            });

            const sender = wallets.find(w => w.id === senderId);
            const receiver = wallets.find(w => w.id === receiverId);

            if (!sender || !receiver) throw new NotFoundException('One or both wallets not found');
            if (sender.balance < amount) throw new ConflictException('Insufficient balance');

            // 2. Deduct and Credit
            sender.balance -= amount;
            receiver.balance += amount;
            await manager.save([sender, receiver]);

            // 3. Log Transactions (Passing the manager ensures atomicity)
            await this.transactionService.create({
                wallet: sender,
                amount: CurrencyConverter.centsToUsd(amount),
                type: TransactionType.TRANSFER_OUT,
                relatedWalletId: receiver.id,
                idempotencyKey: `${idempotencyKey}-out` // Unique key for sender side
            }, manager);

            await this.transactionService.create({
                wallet: receiver,
                amount: CurrencyConverter.centsToUsd(amount),
                type: TransactionType.TRANSFER_IN,
                relatedWalletId: sender.id,
                idempotencyKey: `${idempotencyKey}-in` // Unique key for receiver side
            }, manager);

            return {
                senderBalance: CurrencyConverter.centsToUsd(sender.balance),
                receiverBalance: CurrencyConverter.centsToUsd(receiver.balance)
            };
        });
    }
    async getWalletDetails(walletId: string): Promise<Wallet & { transactions: Transaction[] }> {
        const wallet = await this.walletRepo.findOne({
            where: { id: walletId },
            relations: ['transactions'],
        });

        if (!wallet) throw new NotFoundException('Wallet not found');

        return {
            ...wallet,
            balance: CurrencyConverter.centsToUsd(wallet.balance),
            transactions: wallet.transactions ?? [],
        };
    }
}
