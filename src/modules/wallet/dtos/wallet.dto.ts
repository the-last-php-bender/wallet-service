import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsNumber, Min, IsUUID, IsPositive } from 'class-validator';
import { Currency } from 'src/common/constants/enum';

/**
 * DTO for creating a wallet
 */
export class CreateWalletDto {
    @ApiProperty({
        description: 'Currency of the wallet',
        enum: Currency,
        default: Currency.USD,
        required: false,
    })
    @IsEnum(Currency)
    @IsOptional()
    currency?: Currency = Currency.USD;
}

export class FundWalletDto {
    @ApiProperty({ description: 'Amount to fund the wallet (in USD)', example: 100 })
    @IsNumber()
    @Min(0.01, { message: 'Amount must be positive' })
    @Transform(({ value }) => Math.round(Number(value) * 100))
    amount!: number;
}

export class TransferWalletDto {
    @ApiProperty({ description: 'Sender wallet UUID', example: 'uuid-of-sender' })
    @IsUUID()
    senderId!: string;

    @ApiProperty({ description: 'Receiver wallet UUID', example: 'uuid-of-receiver' })
    @IsUUID()
    receiverId!: string;

    @ApiProperty({ description: 'Amount to transfer', example: 50 })
    @IsNumber()
    @Min(0.01, { message: 'Amount must be positive' })
    @Transform(({ value }) => Math.round(Number(value) * 100))
    amount!: number;
}
