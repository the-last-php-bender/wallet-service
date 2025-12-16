import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './controller/wallet.controller';
import { WalletService } from './services/wallet.service';
import { Wallet } from './entities/wallet.entity';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]), 
    TransactionModule,                
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],             // export if needed elsewhere
})
export class WalletModule {}
