declare module "element-ui" {
  export interface MessageOptions {
    message: string;
    type?: "success" | "warning" | "info" | "error";
    duration?: number;
  }

  export const Message: {
    (options: MessageOptions): void;
    (message: string, type?: string, duration?: number): void;
    success(message: string, duration?: number): void;
    warning(message: string, duration?: number): void;
    info(message: string, duration?: number): void;
    error(message: string, duration?: number): void;
  };
}
