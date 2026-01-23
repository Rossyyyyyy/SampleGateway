import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TransferType, TransferStatus } from '../enums/transfer.enum';

export class CreateTransferDto {
  @ApiProperty({ enum: TransferType, description: 'Type of transfer' })
  @IsEnum(TransferType)
  type: TransferType;

  @ApiProperty({ description: 'Sender name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  senderName: string;

  @ApiPropertyOptional({ description: 'Sender account number' })
  @IsString()
  @IsOptional()
  senderAccountNumber?: string;

  @ApiProperty({ description: 'Beneficiary name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  beneficiaryName: string;

  @ApiProperty({ description: 'Beneficiary account number' })
  @IsString()
  @IsNotEmpty()
  beneficiaryAccountNumber: string;

  @ApiProperty({ description: 'Receiving bank code' })
  @IsString()
  @IsNotEmpty()
  receivingBank: string;

  @ApiProperty({ description: 'Transfer amount', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'PHP' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Purpose of transfer' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  purpose?: string;
}

export class TransferResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  referenceId: string;

  @ApiProperty()
  externalReferenceId: string;

  @ApiProperty({ enum: TransferType })
  type: TransferType;

  @ApiProperty({ enum: TransferStatus })
  status: TransferStatus;

  @ApiProperty()
  senderName: string;

  @ApiProperty()
  beneficiaryName: string;

  @ApiProperty()
  beneficiaryAccountNumber: string;

  @ApiProperty()
  receivingBank: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  statusMessage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}

export class TransferStatusDto {
  @ApiProperty()
  referenceId: string;

  @ApiProperty({ enum: TransferStatus })
  status: TransferStatus;

  @ApiPropertyOptional()
  statusMessage?: string;

  @ApiPropertyOptional()
  completedAt?: Date;
}
