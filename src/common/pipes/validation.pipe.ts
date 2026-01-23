import {
  ValidationPipe as NestValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

const defaultOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
};

export const createValidationPipe = (
  options?: Partial<ValidationPipeOptions>,
): NestValidationPipe => {
  return new NestValidationPipe({
    ...defaultOptions,
    ...options,
  });
};
