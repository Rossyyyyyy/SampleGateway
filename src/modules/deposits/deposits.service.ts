import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { generateTransactionReference } from '../../common/utils/reference-generator.util';
import {
  CreateDepositData,
  Deposit,
  DepositStatus,
} from './entities/deposit.entity';
import { DepositRepository } from './repositories/deposit.repository';
import { CreateDepositDto, DepositResponseDto } from './dto/deposit.dto';

@Injectable()
export class DepositsService {
  private readonly logger = new Logger(DepositsService.name);

  constructor(private readonly depositRepository: DepositRepository) {}

  async createDeposit(dto: CreateDepositDto): Promise<DepositResponseDto> {
    const depositId = generateTransactionReference();
    this.logger.log(`Creating deposit: ${depositId} for user: ${dto.userId}`);

    const createData: CreateDepositData = {
      userId: dto.userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      depositId,
      amount: dto.amount,
      phpAmount: dto.phpAmount,
      currency: dto.currency,
      type: dto.type,
    };

    const deposit = await this.depositRepository.create(createData);

    this.logger.log(`Deposit created successfully: ${deposit.id}`);
    return this.toResponseDto(deposit);
  }

  async getDepositById(id: string): Promise<DepositResponseDto> {
    const deposit = await this.depositRepository.findById(id);

    if (!deposit) {
      throw new NotFoundException(`Deposit not found: ${id}`);
    }

    return this.toResponseDto(deposit);
  }

  async getDepositByDepositId(depositId: string): Promise<DepositResponseDto> {
    const deposit = await this.depositRepository.findByDepositId(depositId);

    if (!deposit) {
      throw new NotFoundException(`Deposit not found: ${depositId}`);
    }

    return this.toResponseDto(deposit);
  }

  async getDepositsByUserId(
    userId: string,
    limit: number = 20,
  ): Promise<DepositResponseDto[]> {
    const deposits = await this.depositRepository.findByUserId(userId, limit);
    return deposits.map((deposit) => this.toResponseDto(deposit));
  }

  async getDepositsByStatus(
    status: DepositStatus,
    limit: number = 100,
  ): Promise<DepositResponseDto[]> {
    const deposits = await this.depositRepository.findByStatus(status, limit);
    return deposits.map((deposit) => this.toResponseDto(deposit));
  }

  async updateDepositStatus(
    id: string,
    status: DepositStatus,
    statusMessage?: string,
  ): Promise<DepositResponseDto> {
    this.logger.log(`Updating deposit status: ${id} to ${status}`);

    const deposit = await this.depositRepository.updateStatus(
      id,
      status,
      statusMessage,
    );

    if (!deposit) {
      throw new NotFoundException(`Deposit not found: ${id}`);
    }

    this.logger.log(`Deposit status updated: ${id}`);
    return this.toResponseDto(deposit);
  }

  async markAsProcessing(
    id: string,
    externalReferenceId: string,
  ): Promise<DepositResponseDto> {
    const deposit = await this.depositRepository.update(id, {
      status: DepositStatus.PROCESSING,
      externalReferenceId,
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit not found: ${id}`);
    }

    return this.toResponseDto(deposit);
  }

  async markAsCompleted(
    id: string,
    statusMessage?: string,
  ): Promise<DepositResponseDto> {
    return this.updateDepositStatus(id, DepositStatus.COMPLETED, statusMessage);
  }

  async markAsFailed(
    id: string,
    failureReason: string,
  ): Promise<DepositResponseDto> {
    const deposit = await this.depositRepository.update(id, {
      status: DepositStatus.FAILED,
      failureReason,
      statusMessage: failureReason,
    });

    if (!deposit) {
      throw new NotFoundException(`Deposit not found: ${id}`);
    }

    return this.toResponseDto(deposit);
  }

  private toResponseDto(deposit: Deposit): DepositResponseDto {
    return {
      id: deposit.id,
      userId: deposit.userId,
      firstName: deposit.firstName,
      lastName: deposit.lastName,
      email: deposit.email,
      depositId: deposit.depositId,
      amount: deposit.amount,
      phpAmount: deposit.phpAmount,
      currency: deposit.currency,
      status: deposit.status,
      type: deposit.type,
      createdAt: deposit.createdAt,
      time: deposit.time,
      externalReferenceId: deposit.externalReferenceId,
      statusMessage: deposit.statusMessage,
      completedAt: deposit.completedAt,
    };
  }
}
