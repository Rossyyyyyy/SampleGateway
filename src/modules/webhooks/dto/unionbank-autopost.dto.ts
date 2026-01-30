import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UnionbankAutopostReferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;
}

export class UnionbankAutopostPayloadDto {
  @ApiProperty({ description: 'UnionBank transaction ID' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: 'Biller reference (senderRefId)' })
  @IsString()
  @IsNotEmpty()
  senderRefId: string;

  @ApiProperty({ description: 'Transaction UUID' })
  @IsString()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Status e.g. COMPLETED, DEBIT_FAILED' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'ISO 8601 transaction date/time' })
  @IsString()
  @IsNotEmpty()
  transactionDateTime: string;

  @ApiPropertyOptional({ description: 'Payment Method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Biller post status (if provided by UB)' })
  @IsOptional()
  @IsString()
  billerPostStatus?: string;

  @ApiPropertyOptional({ type: [UnionbankAutopostReferenceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnionbankAutopostReferenceDto)
  references?: UnionbankAutopostReferenceDto[];
}

export class UnionbankAutopostResponseDto {
  @ApiProperty()
  received: boolean;

  @ApiProperty({ description: 'Idempotency key (transactionId or eventId)' })
  idempotencyKey: string;

  @ApiPropertyOptional()
  message?: string;
}
