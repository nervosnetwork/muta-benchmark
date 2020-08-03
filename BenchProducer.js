const { Muta, utils } = require('@mutadev/muta-sdk');
const { AssetService } = require('@mutadev/service');
const randomBytes = require('randombytes');

const query = `mutation ( $inputRaw: InputRawTransaction! $inputEncryption: InputTransactionEncryption! ) { sendTransaction(inputRaw: $inputRaw, inputEncryption: $inputEncryption) }`;

function hexToTimestamp(hex) {
  const timestamp = Number(utils.toHex(hex));
  if (timestamp <= 9999999999) {
    return timestamp * 1000;
  }
  return timestamp;
}

class AssetBench {
  constructor(options) {
    const { pk, chainId, gap, url, receiver } = options;
    const muta = new Muta({
      chainId,
      timeoutGap: gap,
      endpoint: Array.isArray(url) ? url[0] : url,
    });
    this.client = muta.client();
    this.privateKey = pk;
    this.account = Muta.accountFromPrivateKey(pk);
    this.rawClient = this.client.getRawClient();
    this.service = new AssetService(this.client, this.account);

    this.chainId = chainId;

    this.to = Muta.accountFromPrivateKey(randomBytes(32)).address;
    this.receiver = receiver;
    this.gap = gap;
  }

  async createAsset() {
    const asset = await this.service.write.create_asset({
      supply: 99999999,
      symbol: Math.random().toString(),
      name: Math.random().toString(),
    });
    this.assetId = asset.response.response.succeedData.id;
    await this.client.waitForNextNBlock(1);
    return asset;
  }

  async prepare() {
    const startBlock = await this.client.getLatestBlockHeight();
    this.timeout = utils.toHex(Number(startBlock + Number(this.gap) - 1));
  }

  async start() {
    this.startTime = Date.now();
    this.startBlock = await this.client.getLatestBlockHeight();
    this.startBalance = await this.service.read
      .get_balance({
        asset_id: this.assetId,
        user: this.account.address,
      })
      .then((res) => res.succeedData.balance);
  }

  async end() {
    this.endTime = Date.now();

    await this.client.waitForNextNBlock(1);

    this.endBlock = await this.client.getLatestBlockHeight();
    this.endBalance = await this.service.read
      .get_balance({
        asset_id: this.assetId,
        user: this.account.address,
      })
      .then((res) => res.succeedData.balance);

    const blocks = {};
    for (let height = this.startBlock; height <= this.endBlock; height++) {
      const res = await this.rawClient.getBlock({
        height: utils.toHex(height),
      });

      blocks[height] = {
        round: Number(res.getBlock.header.proof.round),
        timeStamp: hexToTimestamp(res.getBlock.header.timestamp),
        transactionsCount: res.getBlock.orderedTxHashes.length,
      };
    }

    return {
      timeUsage: this.endTime - this.startTime,
      // (- 1) is for wait 1 block to ensure all tx are finished
      blockUsage: this.endBlock - this.startBlock - 1,
      transferProcessed: this.startBalance - this.endBalance,

      blocks,
    };
  }

  produceRequestBody() {
    const timeout = this.timeout;
    const chainId = this.chainId;

    const assetId = this.assetId;
    const to = this.to;

    const signed = utils.signTransaction(
      {
        serviceName: 'asset',
        method: 'transfer',
        payload: JSON.stringify({ asset_id: assetId, to: to, value: 1 }),
        timeout: timeout,
        nonce: `0x${randomBytes(32).toString('hex')}`,
        chainId: `${chainId}`,
        cyclesPrice: '0x01',
        cyclesLimit: '0x5208',
        sender: this.account.address,
      },
      utils.toBuffer(this.privateKey)
    );

    const variables = {
      inputRaw: utils.separateOutRawTransaction(signed),
      inputEncryption: utils.separateOutEncryption(signed),
    };

    return JSON.stringify({
      query,
      variables,
    });
  }
}

exports.AssetBenchProducer = AssetBench;
