import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import {
  CreateUpayDebitCreditCardTransactionDto,
  CreateUpayTransactionDto,
  UpayBillerReferencesResponseDto,
  UpayBillerResponseDto,
  UpayBillerUuidStatusResponseDto,
  UpayInstapayBankResponseDto,
  UpayPesonetBankResponseDto,
  UpayStatusResponseDto,
  UpayTransactionResponseDto,
} from './dto/upay.dto';
import { UpayService } from './upay.service';

@ApiTags('UPay')
@ApiBearerAuth()
@Controller('upay')
export class UpayController {
  constructor(private readonly upayService: UpayService) {}

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new UPay transaction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'UPay transaction created successfully',
    type: UpayTransactionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async createTransaction(
    @Body() createUpayTransactionDto: CreateUpayTransactionDto,
    @IdempotencyKey() idempotencyKey?: string,
  ): Promise<UpayTransactionResponseDto> {
    return this.upayService.createTransaction(
      createUpayTransactionDto,
      idempotencyKey,
    );
  }

  @Post('transactions/debit-credit-card')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new UPay transaction for debit/credit card payment',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'UPay debit/credit card transaction created successfully',
    type: UpayTransactionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async createDebitCreditCardTransaction(
    @Body() createUpayTransactionDto: CreateUpayDebitCreditCardTransactionDto,
    @IdempotencyKey() idempotencyKey?: string,
  ): Promise<UpayTransactionResponseDto> {
    return this.upayService.createDebitCreditCardTransaction(
      createUpayTransactionDto,
      idempotencyKey,
    );
  }

  @Get('transactions/:senderRefId/status')
  @ApiOperation({
    summary: 'Get UPay transaction status by sender reference ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction status retrieved successfully',
    type: UpayStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getTransactionStatus(
    @Param('senderRefId') senderRefId: string,
  ): Promise<UpayStatusResponseDto> {
    return this.upayService.getTransactionStatus(senderRefId);
  }

  @Get('payments/v1/privacy')
  @ApiOperation({ summary: 'Get privacy policy' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Privacy policy retrieved successfully',
    schema: { type: 'object' },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getPrivacyPolicy(): Promise<unknown> {
    return this.upayService.getPrivacyPolicy();
  }

  @Get('billers/:billerUuid')
  @ApiOperation({ summary: 'Get biller details by UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Biller details retrieved successfully',
    type: UpayBillerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Biller not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getBillerDetails(
    @Param('billerUuid') billerUuid: string,
  ): Promise<UpayBillerResponseDto> {
    return this.upayService.getBillerDetails(billerUuid);
  }

  @Get('billers/:billerUuid/references')
  @ApiOperation({ summary: 'Get biller references by UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Biller references retrieved successfully',
    type: UpayBillerReferencesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Biller not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getBillerReferences(
    @Param('billerUuid') billerUuid: string,
  ): Promise<UpayBillerReferencesResponseDto> {
    return this.upayService.getBillerReferences(billerUuid);
  }

  @Get('payments/v1/instapay/banks')
  @ApiOperation({ summary: 'Get InstaPay banks' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'InstaPay bank list retrieved successfully',
    type: UpayInstapayBankResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getInstapayBanks(): Promise<UpayInstapayBankResponseDto> {
    return this.upayService.getInstapayBanks();
  }

  @Get('payments/v1/pesonet/banks')
  @ApiOperation({ summary: 'Get PESONet banks' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PESONet bank list retrieved successfully',
    type: UpayPesonetBankResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getPesonetBanks(): Promise<UpayPesonetBankResponseDto> {
    return this.upayService.getPesonetBanks();
  }

  @Get('payments/v1/transactions/:billerUuid/status')
  @ApiOperation({
    summary:
      'Check status (transactions by biller UUID with biller post status)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Biller UUID status retrieved successfully',
    type: UpayBillerUuidStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Biller not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getBillerUuidStatus(
    @Param('billerUuid') billerUuid: string,
  ): Promise<UpayBillerUuidStatusResponseDto> {
    const result = await this.upayService.getBillerUuidStatus(billerUuid);

    return result;
  }
}
