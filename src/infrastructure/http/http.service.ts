import { Injectable, Logger } from '@nestjs/common';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

@Injectable()
export class HttpService {
  private readonly logger = new Logger(HttpService.name);

  createClient(config: HttpClientConfig): AxiosInstance {
    const client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors(client);

    return client;
  }

  private setupInterceptors(client: AxiosInstance): void {
    client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        this.logger.debug(
          `HTTP Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error: Error) => {
        this.logger.error('HTTP Request Error', error.message);
        return Promise.reject(error);
      },
    );

    client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.debug(
          `HTTP Response: ${response.status} ${response.config.url}`,
        );
        return response;
      },
      (error: Error) => {
        if (axios.isAxiosError(error)) {
          this.logger.error(
            `HTTP Response Error: ${error.response?.status ?? 'No Status'} ${error.config?.url ?? 'Unknown URL'}`,
            error.message,
          );
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T>(
    client: AxiosInstance,
    url: string,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: options?.headers,
      params: options?.params,
      timeout: options?.timeout,
    };
    const response = await client.get<T>(url, config);
    return response.data;
  }

  async post<T, D = unknown>(
    client: AxiosInstance,
    url: string,
    data?: D,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: options?.headers,
      params: options?.params,
      timeout: options?.timeout,
    };
    const response = await client.post<T>(url, data, config);
    return response.data;
  }

  async put<T, D = unknown>(
    client: AxiosInstance,
    url: string,
    data?: D,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: options?.headers,
      params: options?.params,
      timeout: options?.timeout,
    };
    const response = await client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(
    client: AxiosInstance,
    url: string,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      headers: options?.headers,
      params: options?.params,
      timeout: options?.timeout,
    };
    const response = await client.delete<T>(url, config);
    return response.data;
  }
}
