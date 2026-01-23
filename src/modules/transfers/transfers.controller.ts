import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import {
  CreateTransferDto,
  TransferResponseDto,
  TransferStatusDto,
} from './dto/transfer.dto';
import { TransferType } from './enums/transfer.enum';
import { TransfersService } from './transfers.service';

@ApiTags('Transfers')
@ApiBearerAuth()
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new fund transfer (InstaPay or PESONet)' })
  @ApiResponse({
    status: 201,
    description: 'Transfer created successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTransfer(
    @Body() createTransferDto: CreateTransferDto,
    @IdempotencyKey() idempotencyKey?: string,
  ): Promise<TransferResponseDto> {
    return this.transfersService.createTransfer(
      createTransferDto,
      idempotencyKey,
    );
  }

  @Get(':referenceId/status')
  @ApiOperation({ summary: 'Get transfer status by reference ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer status retrieved',
    type: TransferStatusDto,
  })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async getTransferStatus(
    @Param('referenceId') referenceId: string,
    @Query('type') type: TransferType,
  ): Promise<TransferStatusDto> {
    return this.transfersService.getTransferStatus(referenceId, type);
  }
}
