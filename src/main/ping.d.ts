declare module 'ping' {
  export interface PingResponse {
    host: string;
    alive: boolean;
    time: string;
    min: string;
    max: string;
    avg: string;
    packetLoss: string;
    stddev: string;
  }

  export interface PingConfig {
    timeout?: number;
    min_reply?: number;
    extra?: string[];
  }

  export const promise: {
    probe(host: string, config?: PingConfig): Promise<PingResponse>;
  };
}

