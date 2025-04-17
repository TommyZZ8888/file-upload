declare module "axios" {
  export interface AxiosInstance {
    create(config?: any): AxiosInstance;
    interceptors: {
      request: {
        use(onFulfilled?: any, onRejected?: any): number;
      };
      response: {
        use(onFulfilled?: any, onRejected?: any): number;
      };
    };
    request(config: any): Promise<any>;
    get(url: string, config?: any): Promise<any>;
    post(url: string, data?: any, config?: any): Promise<any>;
    put(url: string, data?: any, config?: any): Promise<any>;
    delete(url: string, config?: any): Promise<any>;
  }

  export interface AxiosRequestConfig {
    baseURL?: string;
    headers?: Record<string, string>;
    params?: any;
    data?: any;
    timeout?: number;
  }

  export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: AxiosRequestConfig;
  }

  const axios: AxiosInstance;
  export default axios;
}
