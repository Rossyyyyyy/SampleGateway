import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { SignatureService } from './signature.service';

@Global()
@Module({
  providers: [EncryptionService, SignatureService],
  exports: [EncryptionService, SignatureService],
})
export class SecurityModule {}
