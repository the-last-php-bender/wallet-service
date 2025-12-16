import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsNumber, Min, IsUUID, IsPositive, IsString, IsNotEmpty } from 'class-validator';
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
    @ApiProperty({
        description: 'Amount to fund the wallet (in USD)',
        example: 100
    })
    @IsNumber()
    @Min(0.01, { message: 'Amount must be positive' })
    @Transform(({ value }) => Math.round(Number(value) * 100))
    amount!: number;

    @ApiProperty({
        description: 'Unique key to prevent duplicate processing',
        example: 'req-7a2b-4c9d-8e1f'
    })
    @IsString()
    @IsNotEmpty()
    idempotencyKey!: string;
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
    @ApiProperty({
        description: 'Unique key to prevent duplicate processing',
        example: 'req-3f4e-2d1c-9b8a'
    })
    @IsString()
    @IsNotEmpty()
    idempotencyKey!: string;
}
