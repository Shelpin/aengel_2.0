declare module '@aeternity/aepp-sdk' {
  export class MemoryAccount {
    constructor(options: { secretKey: string });
    get address(): string;
    get publicKey(): string;
    get secretKey(): string;
    signTransaction(tx: any): Promise<string>;
    signMessage(message: string): Promise<string>;
    signTypedData(data: any): Promise<string>;
    signDelegation(delegation: any): Promise<string>;
  }

  export class Node {
    constructor(options: { url: string, internalUrl?: string });
  }

  export class Universal {
    constructor(options: {
      nodes: Array<{ name: string, instance: Node }>,
      accounts: Array<MemoryAccount>,
      compilerUrl?: string,
      networkId?: string
    });
    
    balance(address: string): Promise<string>;
    spend(amount: string, recipient: string, options?: any): Promise<any>;
    signTransaction(tx: any): Promise<string>;
    signMessage(message: string): Promise<string>;
  }

  export function generateKeyPair(): { publicKey: string, secretKey: string };
} 