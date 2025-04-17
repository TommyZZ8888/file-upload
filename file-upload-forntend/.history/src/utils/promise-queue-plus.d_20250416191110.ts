declare module "promise-queue-plus" {
  interface QueueOptions {
    retry?: number;
    retryIsJump?: boolean;
    workReject?: (reason: any) => void;
    queueEnd?: () => void;
  }

  interface Queue {
    push: (task: () => Promise<any>) => void;
    start: () => void;
    stop: () => void;
    getLength: () => number;
  }

  function Queue(concurrency: number, options?: QueueOptions): Queue;
  export default Queue;
}
