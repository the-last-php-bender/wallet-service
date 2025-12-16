import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { WalletService } from '../services/wallet.service';
import { Wallet } from '../entities/wallet.entity';
import { FundWalletDto, TransferWalletDto } from '../dtos/wallet.dto';

@ApiTags('Wallets')
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new wallet' })
    async createWallet(): Promise<Wallet> {
        return this.walletService.createWallet();
    }

    @Post(':id/fund')
    @ApiOperation({ summary: 'Fund a wallet' })
    @ApiParam({ name: 'id', description: 'Wallet UUID' })
    async fundWallet(
        @Param('id') id: string,
        @Body() fundWalletDto: FundWalletDto,
    ): Promise<Wallet> {
        return this.walletService.fundWallet(id, fundWalletDto.amount);
    }


    @Post('transfer')
    @ApiOperation({ summary: 'Transfer funds from one wallet to another' })
    async transferFunds(@Body() transferWalletDto: TransferWalletDto) {
        return this.walletService.transferFunds(
            transferWalletDto.senderId,
            transferWalletDto.receiverId,
            transferWalletDto.amount,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get wallet details with transactions' })
    @ApiParam({ name: 'id', description: 'Wallet UUID' })
    async getWalletDetails(@Param('id') id: string) {
        return this.walletService.getWalletDetails(id);
    }
}
