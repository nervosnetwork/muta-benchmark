const { Muta, AssetService, signTransaction, utils } = require("muta-sdk");
const randomBytes = require("random-bytes");

const query = `mutation ( $inputRaw: InputRawTransaction! $inputEncryption: InputTransactionEncryption! ) { sendTransaction(inputRaw: $inputRaw, inputEncryption: $inputEncryption) }`;

class AssetBench {
  constructor(options) {
    const { pk, chainId, gap, url, receiver } = options;
    const muta = new Muta({
      chainId,
      timeoutGap: gap,
      endpoint: url
    });

    this.client = muta.client;
    this.account = muta.accountFromPrivateKey(pk);
    this.service = new AssetService(this.client, this.account);

    this.chainId = chainId;

    this.to = randomBytes.sync(20).toString("hex");
    this.receiver = receiver;
    this.gap = gap;
  }

  async createAsset() {
    const hash = await this.service.createAsset({
      supply: 99999999,
      symbol: Math.random().toString(),
      name: Math.random().toString()
    });
    const asset = JSON.parse(await this.client.getReceipt(hash));
    this.assetId = asset.id;
    await this.client.waitForNextNEpoch(1);
    return asset;
  }

  async prepare() {
    const startEpoch = await this.client.getEpochHeight();
    this.timeout = utils.toHex(Number(startEpoch + Number(this.gap) - 1));
    this.startBalance = await this.service.getBalance(this.assetId);
  }

  async start() {
    this.startTime = Date.now();
    this.startEpoch = await this.client.getEpochHeight();
  }

  async end() {
    this.endTime = Date.now();

    await this.client.waitForNextNEpoch(1);

    this.endEpoch = await this.client.getEpochHeight();
    this.endBalance = await this.service.getBalance(this.assetId);

    const epochs = {};
    for (let epochId = this.startEpoch; epochId <= this.endEpoch; epochId++ ) {
      const res = await this.client.rawClient.getEpoch({ epochId: utils.toHex(epochId) });
      epochs[epochId] = {
        transactionsCount: res.getEpoch.orderedTxHashes.length
      };
    }

    return {
      timeUsage: this.endTime - this.startTime,
      // (- 1) is for wait 1 epoch to ensure all tx are finished
      epochUsage: this.endEpoch - this.startEpoch - 1,
      transferProcessed: this.startBalance - this.endBalance,

      epochs
    };
  }

  produceRequestBody() {
    const timeout = this.timeout;
    const chainId = this.chainId;

    const assetId = this.assetId;
    const to = this.to;

    const variables = signTransaction(
      {
        serviceName: "asset",
        method: "transfer",
        payload: JSON.stringify({ asset_id: assetId, to: to, value: 1 }),
        timeout: timeout,
        nonce: `0x${randomBytes.sync(32).toString("hex")}`,
        chainId: `${chainId}`,
        cyclesPrice: "0x9999",
        cyclesLimit: "0x9999"
      },
      this.account._privateKey
    );

    return JSON.stringify({
      query,
      variables
    });
  }
}

exports.AssetBenchProducer = AssetBench;
