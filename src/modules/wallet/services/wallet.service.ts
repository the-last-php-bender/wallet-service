import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { TransactionService } from 'src/modules/transaction/services/transaction.service';
import { Currency, TransactionType } from 'src/common/constants/enum';
import { Transaction } from 'src/modules/transaction/entities/transaction.entity';
import { CurrencyConverter } from 'src/common/util/currencyConversion.util';

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,
        private readonly transactionService: TransactionService,
        private readonly dataSource: DataSource,
    ) { }


    async createWallet(): Promise<Wallet> {
        const wallet = this.walletRepo.create();
        return this.walletRepo.save(wallet);
    }

    async fundWallet(walletId: string, amount: number): Promise<Wallet> {
        if (amount <= 0) {
            throw new BadRequestException('Amount must be positive');
        }

        const wallet = await this.walletRepo.findOne({ where: { id: walletId } });
        if (!wallet) {
            throw new NotFoundException('Wallet not found');
        }

        wallet.balance += amount;
        await this.walletRepo.save(wallet);

        await this.transactionService.create({
            wallet,
            amount: CurrencyConverter.centsToUsd(amount),
            type: TransactionType.FUND,
        });

        return {...wallet, balance:CurrencyConverter.centsToUsd(wallet.balance) };
    }
async transferFunds(
    senderId: string,
    receiverId: string,
    amount: number,
): Promise<{
    sender: { id: string; currency: Currency; balance: number };
    receiver: { id: string; currency: Currency; balance: number };
}> {
    if (amount <= 0) {
        throw new BadRequestException('Amount must be positive');
    }

    if (senderId === receiverId) {
        throw new BadRequestException('Cannot transfer to the same wallet');
    }

    return this.dataSource.transaction(async (manager) => {
        const sender: Wallet | null = await manager.findOne(Wallet, { where: { id: senderId } });
        const receiver: Wallet | null = await manager.findOne(Wallet, { where: { id: receiverId } });

        if (!sender) throw new NotFoundException('Sender wallet not found');
        if (!receiver) throw new NotFoundException('Receiver wallet not found');

        if (sender.balance < amount) {
            throw new ConflictException('Insufficient balance');
        }

        // Update balances in cents
        sender.balance -= amount;
        receiver.balance += amount;

        await manager.save(sender);
        await manager.save(receiver);

        // Record transactions in USD
        await this.transactionService.create({
            wallet: sender,
            amount: CurrencyConverter.centsToUsd(amount),
            type: TransactionType.TRANSFER_OUT,
            relatedWalletId: receiver.id,
        });

        await this.transactionService.create({
            wallet: receiver,
            amount: CurrencyConverter.centsToUsd(amount),
            type: TransactionType.TRANSFER_IN,
            relatedWalletId: sender.id,
        });

        // Return wallets with balances converted to USD
        return {
            sender: {
                id: sender.id,
                currency: sender.currency,
                balance: CurrencyConverter.centsToUsd(sender.balance),
            },
            receiver: {
                id: receiver.id,
                currency: receiver.currency,
                balance: CurrencyConverter.centsToUsd(receiver.balance),
            },
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
