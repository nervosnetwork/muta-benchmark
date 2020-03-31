export abstract class Adapter<Adapter = any> {
  protected adapterConfig: Adapter;

  constructor(adapterConfig: Adapter) {
    this.adapterConfig = adapterConfig;
  }

  abstract async onBenchWillStart(): Promise<void>;

  abstract async onBenchFinish(): Promise<void>;

  abstract getBodySync(): string;
}

