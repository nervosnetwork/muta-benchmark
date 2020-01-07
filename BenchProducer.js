const { Muta, AssetService, signTransaction, utils } = require("muta-sdk");
const randomBytes = require("random-bytes");

const query = `mutation ( $inputRaw: InputRawTransaction! $inputEncryption: InputTransactionEncryption! ) { sendTransaction(inputRaw: $inputRaw, inputEncryption: $inputEncryption) }`;

class AssetBench {
  constructor(options) {
    const { pk, chainId, gap, url, assetId, receiver } = options;
    const muta = new Muta({
      chainId,
      timeoutGap: gap,
      endpoint: url
    });

    this.client = muta.client;
    this.account = muta.accountFromPrivateKey(pk);
    this.service = new AssetService(this.client, this.account);

    this.chainId = chainId;
    this.assetId = assetId;

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

  async start() {
    this.startTime = Date.now();
    this.startEpoch = await this.client.getEpochHeight();

    this.startBalance = await this.service.getBalance(this.assetId);
    this.timeout = utils.toHex(Number(this.startEpoch + Number(this.gap) - 1));
  }

  async end() {
    this.endTime = Date.now();

    await this.client.waitForNextNEpoch(1);

    this.endEpoch = await this.client.getEpochHeight();
    this.endBalance = await this.service.getBalance(this.assetId);

    return {
      timeUsage: this.endTime - this.startTime,
      // (- 1) is for wait 1 epoch to ensure all tx are finished
      epochUsage: this.endEpoch - this.startEpoch - 1,
      transferProcessed: this.startBalance - this.endBalance
    };
  }

  produceRequestBody() {
    const variables = signTransaction(
      {
        serviceName: "asset",
        method: "transfer",
        payload: JSON.stringify({ asset_id: this.assetId, to: randomBytes.sync(20).toString("hex"), value: 10 }),
        timeout: this.timeout,
        nonce: `0x${randomBytes.sync(32).toString("hex")}`,
        chainId: `${this.chainId}`,
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
