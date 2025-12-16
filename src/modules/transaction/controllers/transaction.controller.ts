import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../entities/transaction.entity';

@ApiTags('Transactions')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  async getTransactionById(@Param('id') id: string): Promise<Transaction> {
    return this.transactionService.getById(id);
  }
}
