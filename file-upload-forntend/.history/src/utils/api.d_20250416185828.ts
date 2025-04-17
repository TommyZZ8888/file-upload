declare module "@/utils/api" {
  interface ApiResponse<T = any> {
    code: number;
    data: T;
    msg?: string;
  }

  interface PasswordConfig {
    enable: boolean;
    password: string;
  }

  export function getPassword(): Promise<ApiResponse<PasswordConfig>>;
  export function setPassword(config: PasswordConfig): Promise<ApiResponse>;
}
