import { ConfigService } from '@nestjs/config';

/**
 * ConfigService Mock Factory for Presentation Layer Testing
 * Provides controllable configuration values for testing
 */
export class ConfigServiceMockFactory {
  static create(
    configOverrides: Record<string, any> = {},
  ): jest.Mocked<ConfigService> {
    const defaultConfig = {
      JWT_ACCESS_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      NODE_ENV: 'test',
      DATABASE_URL: 'test-database-url',
      ...configOverrides,
    };

    return {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        return defaultConfig[key] !== undefined
          ? defaultConfig[key]
          : defaultValue;
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const value = defaultConfig[key];
        if (value === undefined) {
          throw new Error(`Configuration key "${key}" not found`);
        }
        return value;
      }),
    } as any;
  }

  static createWithMissingSecret(): jest.Mocked<ConfigService> {
    return {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') {
          return undefined;
        }
        return 'test-value';
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') {
          throw new Error(`Configuration key "${key}" not found`);
        }
        return 'test-value';
      }),
    } as any;
  }

  static createSpy(
    configValues: Record<string, any> = {},
  ): jest.Mocked<ConfigService> {
    const config = {
      JWT_ACCESS_SECRET: 'test-access-secret',
      ...configValues,
    };

    return {
      get: jest.fn().mockImplementation((key: string) => config[key]),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (config[key] === undefined) {
          throw new Error(`Configuration key "${key}" not found`);
        }
        return config[key];
      }),
    } as any;
  }
}
