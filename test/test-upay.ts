import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UnionbankModule } from '../src/integrations/unionbank/unionbank.module';
import { UnionbankUpayService } from '../src/integrations/unionbank/services/unionbank-upay.service';
import { unionbankConfig } from '../src/config/unionbank.config';
// import { HttpService } from '../src/infrastructure/http/http.service'; // REMOVED
import { HttpModule } from '../src/infrastructure/http/http.module';
import { Logger } from '@nestjs/common';
import { AxiosError } from 'axios';

async function runTest() {
  const logger = new Logger('UpayTest');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [unionbankConfig],
      }),
      HttpModule,
      UnionbankModule,
    ],
    // providers: [HttpService], // REMOVED
  }).compile();

  const upayService =
    moduleFixture.get<UnionbankUpayService>(UnionbankUpayService);

  // Sample data from user request
  const sampleRequest = {
    userId: 'B3nCv3Ed5FVwWUxxcZiw7MDCF0p2',
    firstName: 'Brian',
    lastName: 'Perez',
    email: 'perezbrian.developer@gmail.com',
    amount: 100,
    phpAmount: 100,
    currency: 'PHP',
    // Generated ref ID
    senderRefId: `TEST-${Date.now()}`,
  };

  logger.log('Starting UPay Test...');
  logger.log(`Created Ref ID: ${sampleRequest.senderRefId}`);

  try {
    // 1. Create Transaction
    logger.log('1. Creating Transaction...');
    const transaction = await upayService.createTransaction({
      senderRefId: sampleRequest.senderRefId,
      emailAddress: sampleRequest.email,
      amount: sampleRequest.amount,
      callbackUrl: 'https://google.com', // Test callback
      firstName: sampleRequest.firstName,
      lastName: sampleRequest.lastName,
      paymentMethod: 'paygate',
      skipWhitelabelPage: false,
    });

    logger.log('Transaction Created Successfully!');
    logger.log(JSON.stringify(transaction, null, 2));

    // 2. Check Status
    if (transaction.senderRefId) {
      logger.log('2. Checking Status...');
      const status = await upayService.getTransactionStatus(
        transaction.senderRefId,
      );
      logger.log('Status Retrieved Successfully!');
      logger.log(JSON.stringify(status, null, 2));
    }
  } catch (error) {
    logger.error('Test Failed!');
    if (error instanceof Error) {
      logger.error(error.message);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        logger.error(JSON.stringify(axiosError.response.data, null, 2));
      }
    } else {
      logger.error(String(error));
    }
  }

  await moduleFixture.close();
}

void runTest();
