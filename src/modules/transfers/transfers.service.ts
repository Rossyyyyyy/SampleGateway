import { Injectable, Logger } from '@nestjs/common';
import { TransactionNotFoundException } from '../../common/exceptions';
import { generateTransferReference } from '../../common/utils/reference-generator.util';
import {
  UnionbankInstapayService,
  UnionbankPesonetService,
} from '../../integrations/unionbank';
import { CreateInstapayTransferParams } from '../../integrations/unionbank/dto/request/instapay-transfer.request.dto';
import { CreatePesonetTransferParams } from '../../integrations/unionbank/dto/request/pesonet-transfer.request.dto';
import {
  CreateTransferDto,
  TransferResponseDto,
  TransferStatusDto,
} from './dto/transfer.dto';
import { TransferStatus, TransferType } from './enums/transfer.enum';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly instapayService: UnionbankInstapayService,
    private readonly pesonetService: UnionbankPesonetService,
  ) {}

  async createTransfer(
    dto: CreateTransferDto,
    requestId?: string,
  ): Promise<TransferResponseDto> {
    const referenceId = generateTransferReference();
    this.logger.log(`Creating ${dto.type} transfer: ${referenceId}`);

    try {
      if (dto.type === TransferType.INSTAPAY) {
        return await this.createInstapayTransfer(dto, referenceId, requestId);
      } else {
        return await this.createPesonetTransfer(dto, referenceId, requestId);
      }
    } catch (error) {
      this.logger.error(
        `Transfer creation failed: ${referenceId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async createInstapayTransfer(
    dto: CreateTransferDto,
    referenceId: string,
    requestId?: string,
  ): Promise<TransferResponseDto> {
    const params: CreateInstapayTransferParams = {
      senderRefId: referenceId,
      senderName: dto.senderName,
      senderAccountNumber: dto.senderAccountNumber,
      beneficiaryName: dto.beneficiaryName,
      beneficiaryAccountNumber: dto.beneficiaryAccountNumber,
      receivingBank: dto.receivingBank,
      amount: dto.amount,
      currency: dto.currency,
      purpose: dto.purpose,
    };

    const response = await this.instapayService.createTransfer(
      params,
      requestId,
    );

    // TODO: Save transfer to database

    return {
      id: referenceId,
      referenceId,
      externalReferenceId: response.ubpTranId,
      type: TransferType.INSTAPAY,
      status: this.mapUnionbankStatus(response.status),
      senderName: dto.senderName,
      beneficiaryName: dto.beneficiaryName,
      beneficiaryAccountNumber: dto.beneficiaryAccountNumber,
      receivingBank: dto.receivingBank,
      amount: dto.amount,
      currency: dto.currency ?? 'PHP',
      statusMessage: response.statusMessage,
      createdAt: new Date(),
    };
  }

  private async createPesonetTransfer(
    dto: CreateTransferDto,
    referenceId: string,
    requestId?: string,
  ): Promise<TransferResponseDto> {
    const params: CreatePesonetTransferParams = {
      senderRefId: referenceId,
      senderName: dto.senderName,
      senderAccountNumber: dto.senderAccountNumber,
      beneficiaryName: dto.beneficiaryName,
      beneficiaryAccountNumber: dto.beneficiaryAccountNumber,
      receivingBank: dto.receivingBank,
      amount: dto.amount,
      currency: dto.currency,
      purpose: dto.purpose,
    };

    const response = await this.pesonetService.createTransfer(
      params,
      requestId,
    );

    // TODO: Save transfer to database

    return {
      id: referenceId,
      referenceId,
      externalReferenceId: response.ubpTranId,
      type: TransferType.PESONET,
      status: this.mapUnionbankStatus(response.status),
      senderName: dto.senderName,
      beneficiaryName: dto.beneficiaryName,
      beneficiaryAccountNumber: dto.beneficiaryAccountNumber,
      receivingBank: dto.receivingBank,
      amount: dto.amount,
      currency: dto.currency ?? 'PHP',
      statusMessage: response.statusMessage,
      createdAt: new Date(),
    };
  }

  async getTransferStatus(
    referenceId: string,
    type: TransferType,
    requestId?: string,
  ): Promise<TransferStatusDto> {
    this.logger.log(`Getting transfer status: ${referenceId}`);

    try {
      if (type === TransferType.INSTAPAY) {
        const response = await this.instapayService.getTransferStatus(
          referenceId,
          requestId,
        );
        return {
          referenceId,
          status: this.mapUnionbankStatus(response.status),
          statusMessage: response.statusMessage,
          completedAt: response.tranFinishDate
            ? new Date(response.tranFinishDate)
            : undefined,
        };
      } else {
        const response = await this.pesonetService.getTransferStatus(
          referenceId,
          requestId,
        );
        return {
          referenceId,
          status: this.mapUnionbankStatus(response.status),
          statusMessage: response.statusMessage,
          completedAt: response.tranFinishDate
            ? new Date(response.tranFinishDate)
            : undefined,
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to get transfer status: ${referenceId}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new TransactionNotFoundException(referenceId);
    }
  }

  private mapUnionbankStatus(status: string): TransferStatus {
    const statusMap: Record<string, TransferStatus> = {
      PENDING: TransferStatus.PENDING,
      PROCESSING: TransferStatus.PROCESSING,
      SUCCESS: TransferStatus.COMPLETED,
      COMPLETED: TransferStatus.COMPLETED,
      FAILED: TransferStatus.FAILED,
      CANCELLED: TransferStatus.CANCELLED,
    };

    return statusMap[status] ?? TransferStatus.PENDING;
  }
}
