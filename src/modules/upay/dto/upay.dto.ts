import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  UpayBiller,
  UpayBillerReference,
} from '../../../integrations/unionbank/dto/response/upay-biller.response.dto';

export const UPAY_PAYMENT_METHODS = [
  'debit/credit',
  'ub online',
  'instapay',
  'instapay p2b',
  'paygate',
  'gcash',
  'grabpay',
  'bayad_center',
  'cebl',
  'ecpay',
  'plwn',
  'mlh',
  'smr',
  'rds',
] as const;

/**
 * UPay Reference DTO
 */
export class UpayReferenceDto {
  @ApiProperty({ description: 'Reference index', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  index: number;

  @ApiProperty({ description: 'Reference value', example: 'John' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

/**
 * Create UPay Transaction DTO
 */
export class CreateUpayTransactionDto {
  @ApiProperty({
    description: 'Email address of the payor',
    example: 'juandelacruz@email.com',
    maxLength: 50,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  emailAddress: string;

  @ApiPropertyOptional({
    description: 'Mobile number (10 digits, supports DITO +63 8)',
    example: '9171234567',
    maxLength: 13,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10,13}$/, {
    message: 'Mobile number must be 10-13 digits',
  })
  @MaxLength(13)
  mobileNumber?: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: UPAY_PAYMENT_METHODS,
    default: 'paygate',
  })
  @IsIn(UPAY_PAYMENT_METHODS)
  @IsOptional()
  paymentMethod?: (typeof UPAY_PAYMENT_METHODS)[number];

  @ApiPropertyOptional({
    description: 'Skip white label page',
    default: false,
  })
  @IsOptional()
  skipWhitelabelPage?: boolean;

  @ApiProperty({
    description: 'Callback URL for redirect after payment',
    example: 'https://www.example.com/callback',
    maxLength: 255,
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  @MaxLength(255)
  callbackUrl: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'User reference number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  userRef?: string;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Additional reference' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  additionalRef?: string;

  @ApiPropertyOptional({
    description: 'Custom references array',
    type: [UpayReferenceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpayReferenceDto)
  @IsOptional()
  references?: UpayReferenceDto[];
}

/**
 * Create UPay Transaction DTO (Debit/Credit Card)
 *
 * Separate class (instead of `Omit<>`) so Swagger + validation work correctly.
 */
export class CreateUpayDebitCreditCardTransactionDto {
  @ApiProperty({
    description: 'Email address of the payor',
    example: 'juandelacruz@email.com',
    maxLength: 50,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  emailAddress: string;

  @ApiPropertyOptional({
    description: 'Mobile number (10 digits, supports DITO +63 8)',
    example: '9171234567',
    maxLength: 13,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10,13}$/, {
    message: 'Mobile number must be 10-13 digits',
  })
  @MaxLength(13)
  mobileNumber?: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Skip white label page',
    default: false,
  })
  @IsOptional()
  skipWhitelabelPage?: boolean;

  @ApiProperty({
    description: 'Callback URL for redirect after payment',
    example: 'https://www.example.com/callback',
    maxLength: 255,
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  @MaxLength(255)
  callbackUrl: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'User reference number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  userRef?: string;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Additional reference' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  additionalRef?: string;
}

/**
 * UPay Transaction Response DTO
 */
export class UpayTransactionResponseDto {
  @ApiPropertyOptional({ description: 'Response code', example: 'SP' })
  code?: string;

  @ApiProperty({ description: 'Sender reference ID' })
  senderRefId: string;

  @ApiProperty({ description: 'Transaction UUID' })
  uuid: string;

  @ApiPropertyOptional({ description: 'Transaction state' })
  state?: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  transactionId?: string;

  @ApiPropertyOptional({ description: 'QR code string (for InstaPay)' })
  qrCode?: string;

  @ApiPropertyOptional({
    description: 'Redirect URL or message',
  })
  message?: string;

  @ApiPropertyOptional({ description: 'Payment URL (legacy)' })
  paymentUrl?: string;

  @ApiPropertyOptional({ description: 'Status (legacy)' })
  status?: string;
}

/**
 * UPay Status Response DTO
 */
export class UpayStatusResponseDto {
  @ApiProperty({ description: 'Sender reference ID' })
  senderRefId: string;

  @ApiProperty({ description: 'Transaction UUID' })
  uuid: string;

  @ApiProperty({
    description: 'Transaction status',
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'],
  })
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiPropertyOptional({ description: 'Payment date' })
  paidAt?: string;

  @ApiPropertyOptional({ description: 'Payment method used' })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Status message' })
  message?: string;
}

/**
 * UPay Biller Response DTO
 */
export class UpayBillerResponseDto {
  @ApiProperty()
  billers: UpayBiller[];
}

/**
 * UPay Biller References Response DTO
 */
export class UpayBillerReferencesResponseDto {
  @ApiProperty()
  references: UpayBillerReference[];
}
