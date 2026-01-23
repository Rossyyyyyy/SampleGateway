import { DynamicModule, Global, Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { LocalStorageConfig } from './interfaces/local-storage.interface';

@Global()
@Module({})
export class LocalStorageModule {
  /**
   * Register local storage module with default configuration
   * Default path: <project_root>/data/local-storage-test/
   */
  static forRoot(): DynamicModule {
    return {
      module: LocalStorageModule,
      providers: [
        {
          provide: LocalStorageService,
          useFactory: () => new LocalStorageService(),
        },
      ],
      exports: [LocalStorageService],
    };
  }

  /**
   * Register local storage module with custom configuration
   */
  static forRootAsync(config: LocalStorageConfig): DynamicModule {
    return {
      module: LocalStorageModule,
      providers: [
        {
          provide: LocalStorageService,
          useFactory: () => new LocalStorageService(config),
        },
      ],
      exports: [LocalStorageService],
    };
  }

  /**
   * Register for a specific feature module with isolated storage
   * Useful for module-specific test data
   */
  static forFeature(featureName: string): DynamicModule {
    const basePath = `data/local-storage-test/${featureName}`;
    return {
      module: LocalStorageModule,
      providers: [
        {
          provide: `LOCAL_STORAGE_${featureName.toUpperCase()}`,
          useFactory: () => new LocalStorageService({ basePath }),
        },
      ],
      exports: [`LOCAL_STORAGE_${featureName.toUpperCase()}`],
    };
  }
}
