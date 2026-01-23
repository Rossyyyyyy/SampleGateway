import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseConfigType } from '../../config/firebase.config';

@Injectable()
export class FirebaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;
  private firestoreInstance: admin.firestore.Firestore | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.logger.log('Initializing Firebase...');

    const firebaseConfig =
      this.configService.get<FirebaseConfigType>('firebase');

    if (
      !firebaseConfig?.projectId ||
      !firebaseConfig?.clientEmail ||
      !firebaseConfig?.privateKey
    ) {
      this.logger.warn(
        'Firebase configuration incomplete - skipping initialization',
      );
      return;
    }

    try {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      });

      this.firestoreInstance = this.app.firestore();
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Firebase',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.app) {
      this.logger.log('Shutting down Firebase...');
      await this.app.delete();
      this.logger.log('Firebase shut down successfully');
    }
  }

  get firestore(): admin.firestore.Firestore {
    if (!this.firestoreInstance) {
      throw new Error('Firestore not initialized');
    }
    return this.firestoreInstance;
  }

  get auth(): admin.auth.Auth {
    if (!this.app) {
      throw new Error('Firebase not initialized');
    }
    return this.app.auth();
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.firestoreInstance) {
        return false;
      }
      // Try to access collections to verify connection
      await this.firestoreInstance.listCollections();
      return true;
    } catch {
      return false;
    }
  }

  // Collection references
  collection(collectionPath: string): admin.firestore.CollectionReference {
    return this.firestore.collection(collectionPath);
  }

  doc(documentPath: string): admin.firestore.DocumentReference {
    return this.firestore.doc(documentPath);
  }
}
