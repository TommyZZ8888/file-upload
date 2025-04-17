declare module "@/utils/sse" {
  interface SSEManager {
    subscribe: (event: string, callback: () => void) => void;
    unsubscribe: (event: string) => void;
  }

  const sseManager: SSEManager;
  export default sseManager;
}
