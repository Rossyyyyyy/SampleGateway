import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
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
}
