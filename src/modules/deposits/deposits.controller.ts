import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DepositStatus } from './entities/deposit.entity';
import { DepositsService } from './deposits.service';
import {
  CreateDepositDto,
  DepositQueryDto,
  DepositResponseDto,
  UpdateDepositStatusDto,
} from './dto/deposit.dto';

@ApiTags('Deposits')
@ApiBearerAuth()
@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deposit' })
  @ApiResponse({
    status: 201,
    description: 'Deposit created successfully',
    type: DepositResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createDeposit(
    @Body() createDepositDto: CreateDepositDto,
  ): Promise<DepositResponseDto> {
    return this.depositsService.createDeposit(createDepositDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deposit by ID' })
  @ApiResponse({
    status: 200,
    description: 'Deposit found',
    type: DepositResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async getDeposit(@Param('id') id: string): Promise<DepositResponseDto> {
    return this.depositsService.getDepositById(id);
  }

  @Get('reference/:depositId')
  @ApiOperation({ summary: 'Get deposit by deposit reference ID' })
  @ApiResponse({
    status: 200,
    description: 'Deposit found',
    type: DepositResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async getDepositByReference(
    @Param('depositId') depositId: string,
  ): Promise<DepositResponseDto> {
    return this.depositsService.getDepositByDepositId(depositId);
  }

  @Get()
  @ApiOperation({ summary: 'Query deposits' })
  @ApiResponse({
    status: 200,
    description: 'List of deposits',
    type: [DepositResponseDto],
  })
  async queryDeposits(
    @Query() query: DepositQueryDto,
  ): Promise<DepositResponseDto[]> {
    if (query.userId) {
      return this.depositsService.getDepositsByUserId(
        query.userId,
        query.limit,
      );
    }

    if (query.status) {
      return this.depositsService.getDepositsByStatus(
        query.status,
        query.limit,
      );
    }

    // Default: return pending deposits
    return this.depositsService.getDepositsByStatus(
      DepositStatus.PENDING,
      query.limit ?? 20,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update deposit status' })
  @ApiResponse({
    status: 200,
    description: 'Deposit status updated',
    type: DepositResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async updateDepositStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateDepositStatusDto,
  ): Promise<DepositResponseDto> {
    return this.depositsService.updateDepositStatus(
      id,
      updateDto.status,
      updateDto.statusMessage,
    );
  }
}
