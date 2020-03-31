import { Options } from 'autocannon';
import { Account, Client, Muta } from 'muta-sdk';
import { MutaContext } from 'muta-sdk/build/main/Muta';

interface BenchContextOptions<Adapter = any> {
  /* autocannon options */
  duration: number;
  connections: number;
  url: string;

  /* muta options */
  chainId: string;
  timeoutGap: number;

  /* runner option */
  // cpu number
  cpu: number;
  // adapter path
  adapter: string;
  // adapter constructor config
  adapterConfig: Adapter;

  privateKey: string;
}

class BenchContext<Adapter = any> {
  options: BenchContextOptions<Adapter>;

  private readonly muta: Muta;

  private readonly client: Client;

  private readonly account: Account;

  constructor(options: BenchContextOptions<Adapter>) {
    this.options = options;

    this.muta = new Muta(this.getMutaContext());
    this.client = this.muta.client();

    this.account = Muta.accountFromPrivateKey(options.privateKey);
  }

  getMutaContext(): MutaContext {
    const { url, chainId, timeoutGap } = this.options;
    return {
      chainId: chainId,
      endpoint: url,
      timeoutGap,
      consensusInterval: 3000,
    };
  }

  getMuta(): Muta {
    return this.muta;
  }

  getMutaClient(): Client {
    return this.client;
  }

  getAccount(): Account {
    return this.account;
  }

  getCannonOptions(): Options {
    const { duration, url, connections } = this.options;
    return {
      duration,
      url,
      connections,
    };
  }

  getBenchRunnerConfig() {
    const { cpu } = this.options;
    return {
      cpu,
    };
  }

  getAdapterPath(): string {
    return this.options.adapter;
  }

  getAdapterConfig<Adapter = any>(): Adapter {
    return (this.options.adapterConfig as any) as Adapter;
  }
}

export { BenchContext };

let context: Readonly<BenchContext>;

export function createContext(options: BenchContextOptions) {
  context = new BenchContext(options);
}

export function useContext() {
  return context;
}
