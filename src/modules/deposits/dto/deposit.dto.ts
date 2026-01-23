import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DepositStatus, DepositType } from '../entities/deposit.entity';

export class CreateDepositDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Amount in original currency', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Amount in PHP', minimum: 0 })
  @IsNumber()
  @Min(0)
  phpAmount: number;

  @ApiProperty({ description: 'Currency code', default: 'PHP' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ enum: DepositType, description: 'Type of deposit' })
  @IsEnum(DepositType)
  type: DepositType;
}

export class DepositResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  depositId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  phpAmount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: DepositStatus })
  status: DepositStatus;

  @ApiProperty({ enum: DepositType })
  type: DepositType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  time: string;

  @ApiPropertyOptional()
  externalReferenceId?: string;

  @ApiPropertyOptional()
  statusMessage?: string;

  @ApiPropertyOptional()
  completedAt?: Date;
}

export class UpdateDepositStatusDto {
  @ApiProperty({ enum: DepositStatus, description: 'New status' })
  @IsEnum(DepositStatus)
  status: DepositStatus;

  @ApiPropertyOptional({ description: 'Status message' })
  @IsString()
  @IsOptional()
  statusMessage?: string;
}

export class DepositQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ enum: DepositStatus, description: 'Filter by status' })
  @IsEnum(DepositStatus)
  @IsOptional()
  status?: DepositStatus;

  @ApiPropertyOptional({ description: 'Limit results', default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
