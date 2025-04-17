declare module "element-plus" {
  import { ElMessage } from "element-plus";

  export { ElMessage };

  export interface ElMessageOptions {
    message: string;
    type?: "success" | "warning" | "info" | "error";
    duration?: number;
  }

  export function ElMessage(options: ElMessageOptions): void;
  export function ElMessage(
    message: string,
    type?: string,
    duration?: number
  ): void;
}
