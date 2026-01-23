import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class WebhookPayloadDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({ description: 'Event ID' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ description: 'Timestamp of the event' })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({ description: 'Event data' })
  @IsObject()
  data: Record<string, unknown>;
}

export class WebhookResponseDto {
  @ApiProperty()
  received: boolean;

  @ApiProperty()
  eventId: string;

  @ApiPropertyOptional()
  message?: string;
}

export interface ProcessedWebhookEvent {
  eventId: string;
  eventType: string;
  processed: boolean;
  processedAt: Date;
}
