import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface RequestConfig extends AxiosRequestConfig {
  name?: string;
  description?: string;
  environmentVariables?: Record<string, string>;
  url?: string;
  method?: string;
  baseURL?: string;
}

export interface ResponseData extends AxiosResponse {
  duration: number;
  timestamp: Date;
}

export interface AuthProvider {
  type: string;
  authenticate(): Promise<Record<string, string>>;
  isAuthenticated(): boolean;
  getAuthHeaders(): Record<string, string>;
}

export interface Environment {
  name: string;
  variables: Record<string, string>;
  baseUrl?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: Request[];
  environments?: Environment[];
}

export interface Request {
  id: string;
  name: string;
  description?: string;
  config: RequestConfig;
  tests?: RequestTest[];
}

export interface RequestTest {
  name: string;
  condition: string;
  expected: unknown;
}

export interface Plugin {
  name: string;
  version: string;
  onRequest?(config: RequestConfig): Promise<RequestConfig>;
  onResponse?(response: ResponseData): Promise<ResponseData>;
  onError?(error: Error): Promise<void>;
} 