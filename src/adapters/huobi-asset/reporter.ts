import Table from 'cli-table3';
import { AssetService, AssetServiceModel } from 'huobi-chain-sdk';
import _ from 'lodash';
import { utils } from 'muta-sdk';
import { BindingClassPrototype } from 'muta-sdk/build/main/service/binding';
import { useContext } from '../../context';
import { SimpleReporter } from '../../reporters';

interface ReporterObject {
  balance: number;
  timestamp: number;
  block: number;
}

function round(x: string | number) {
  return Math.round(Number(x)).toFixed(2);
}

export class BalanceReporter extends SimpleReporter<ReporterObject> {
  service: BindingClassPrototype<AssetServiceModel>;

  assetId: string;

  user: string;

  constructor(assetId: string, user: string) {
    super();

    this.assetId = assetId;
    this.user = user;

    const client = useContext().getMutaClient();
    this.service = new AssetService(client);
  }

  async produceStart(): Promise<ReporterObject> {
    return this.produceReportObject(true);
  }

  async produceEnd(): Promise<ReporterObject> {
    return this.produceReportObject(false);
  }

  async report(start: ReporterObject, end: ReporterObject): Promise<void> {
    const txCount = start.balance - end.balance;
    const blockCount = end.block - start.block;

    const client = useContext().getMutaClient();

    const balanceTable = new Table({ head: ['', 'balance', 'block height'] });
    const duration = (end.timestamp - start.timestamp) / 1000;

    const blocks = await Promise.all(
      _.range(start.block, end.block + 1).map(height => client.getBlock(utils.toHex(height))),
    );

    // @ts-ignore
    balanceTable.push({ init: [start.balance, start.block] }, { done: [end.balance, end.block] });

    console.log('TPS:');
    console.log(balanceTable.toString());

    console.log(`${round(txCount / blockCount)} tx/block`);
    console.log(`${round(duration / blockCount)} sec/block`);
    console.log(`${round(txCount / duration)} tx/sec`);

    console.log(
      JSON.stringify({
        blocks: blocks.map(block => [
          Number(block.header.height),
          block.orderedTxHashes.length,
          Number(block.header.proof.round),
        ]),
        tx_block: round(txCount / blockCount),
        sec_block: round(duration / blockCount),
        tx_sec: round(txCount / duration),
        start: start.timestamp,
        end: end.timestamp,
      }),
    );
  }

  private async produceReportObject(delayTimestamp: boolean): Promise<ReporterObject> {
    const client = useContext().getMutaClient();
    let timestamp = Date.now();

    const [block, balance] = await Promise.all([
      client.getLatestBlockHeight(),
      this.service.get_balance({
        asset_id: this.assetId,
        user: this.user,
      }),
    ]);

    if (delayTimestamp) {
      timestamp = Date.now();
    }

    return {
      block,
      balance: Number(balance.succeedData.balance),
      timestamp,
    };
  }
}
