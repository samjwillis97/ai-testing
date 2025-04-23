export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface HTTPRequest {
  url: string;
  method: HTTPMethod;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface HTTPResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
} 