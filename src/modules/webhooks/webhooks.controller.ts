import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  UnionbankAutopostPayloadDto,
  UnionbankAutopostResponseDto,
} from './dto/unionbank-autopost.dto';
import { UnionbankAutopostAuthGuard } from './guards/unionbank-autopost-auth.guard'; 
import { WebhookPayloadDto, WebhookResponseDto } from './dto/webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('unionbank')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook notifications from UnionBank' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook received',
    type: WebhookResponseDto,
  })
  async receiveUnionbankWebhook(
    @Body() payload: WebhookPayloadDto,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.processWebhook(payload);
  }

  @Public()
  @Post('unionbank/autopost')
  @UseGuards(UnionbankAutopostAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UnionBank UPay biller autopost notifications' })
  @ApiResponse({ status: HttpStatus.OK, type: UnionbankAutopostResponseDto })
  async receiveUnionbankAutopost(
    @Body() payload: UnionbankAutopostPayloadDto,
  ): Promise<UnionbankAutopostResponseDto> {
    return this.webhooksService.processUnionbankAutopost(payload);
  }
}
