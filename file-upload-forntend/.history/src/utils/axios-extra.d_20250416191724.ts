declare module "axios-extra" {
  interface AxiosExtraConfig {
    maxConcurrent?: number;
    queueOptions?: {
      retry?: number;
      retryIsJump?: boolean;
    };
  }

  interface AxiosExtraInstance {
    create(config?: AxiosExtraConfig): any;
    interceptors: {
      request: {
        use(onFulfilled?: any, onRejected?: any): number;
      };
      response: {
        use(onFulfilled?: any, onRejected?: any): number;
      };
    };
  }

  const axiosExtra: AxiosExtraInstance;
  export default axiosExtra;
}
