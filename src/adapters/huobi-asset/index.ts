import { AssetService, AssetServiceModel } from 'huobi-chain-sdk';
import _ from 'lodash';
import { utils } from 'muta-sdk';
import { BindingClassPrototype } from 'muta-sdk/build/main/service/binding';
import ora from 'ora';
import { useContext } from '../../context';
import { TxProducer } from '../../producers/TxProducer';
import { Adapter } from '../BaseBenchAdapter';
import { BalanceReporter } from './reporter';

interface HuobiAssetAdapterOption {
  assetId?: string;
  receiver: string;
}

export interface WorkerData {
  chainId: string;
  timeout: string;
  payload: {
    asset_id: string;
    to: string;
    value: number;
  };
  privateKey: string;
}

class HuobiAssetAdapter extends Adapter<HuobiAssetAdapterOption> {
  producer!: TxProducer;

  service!: BindingClassPrototype<AssetServiceModel>;

  reporter!: BalanceReporter;

  constructor(adapterConfig: HuobiAssetAdapterOption) {
    super(adapterConfig);

    this.adapterConfig = _.defaults<HuobiAssetAdapterOption, HuobiAssetAdapterOption>(adapterConfig, {
      receiver: '0x0000000000000000000000000000000000000001',
    });

    const context = useContext();
    const client = context.getMutaClient();
    const account = context.getAccount();
    this.service = new AssetService(client, account);
  }

  createAsset() {
    const service = this.service;

    return service.create_asset({
      supply: Number.MAX_SAFE_INTEGER,
      symbol: Math.random().toString(),
      name: Math.random().toString(),
      precision: 8,
    });
  }

  async onBenchWillStart() {
    const context = useContext();
    const { timeoutGap, chainId } = context.getMutaContext();
    const account = context.getAccount();
    const address = account.address;
    const client = context.getMutaClient();

    const startBlock = await client.getLatestBlockHeight();
    const timeout = utils.toHex(Number(startBlock + Number(timeoutGap) - 1));

    if (!this.adapterConfig.assetId) {
      const spin = ora('creating asset').start();
      const asset = await this.createAsset();
      this.adapterConfig.assetId = utils.toHex(asset.response.ret.id);
      spin.succeed('asset created');
    }

    this.producer = new TxProducer({
      workerPath: __dirname + '/worker.js',
      workerData: {
        chainId: chainId,
        timeout: timeout,
        payload: {
          asset_id: this.adapterConfig.assetId,
          to: '0x0000000000000000000000000000000000000001',
          value: 1,
        },
        // @ts-ignore
        privateKey: account._privateKey.toString('hex'),
      },
      workerCount: 3,
      maxPoolSize: 100000,
    });

    await this.producer.prepareNTx(10000);

    this.reporter = new BalanceReporter(this.adapterConfig.assetId, address);
    await this.reporter.start();
  }

  getBodySync() {
    return this.producer.getBodySync() ?? '';
  }

  async onBenchFinish() {
    await this.reporter.end();
    await this.producer.terminate();
  }
}

export { HuobiAssetAdapter as Adapter };
