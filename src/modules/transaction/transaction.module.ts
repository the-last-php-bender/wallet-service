import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Wallet]), // make repositories available
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService], // export if other modules (like WalletService) need it
})
export class TransactionModule {}
