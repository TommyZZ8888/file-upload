import { baseUrl } from "./http";

interface SSECallback {
  onmessage: (event: MessageEvent) => void;
  onerror: (error: Event) => void;
  onopen?: () => void;
}

const sse = (url: string, callback: SSECallback): EventSource => {
  const source = new EventSource(url);

  source.onmessage = (event: MessageEvent) => {
    callback.onmessage(event);
  };

  source.onerror = (error: Event) => {
    callback.onerror(error);
  };

  if (callback.onopen) {
    source.onopen = () => {
      callback.onopen?.();
    };
  }

  return source;
};

export default sse;
