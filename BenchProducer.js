const { Muta, AssetService, utils } = require("muta-sdk");
const randomBytes = require("randombytes");

const query = `mutation ( $inputRaw: InputRawTransaction! $inputEncryption: InputTransactionEncryption! ) { sendTransaction(inputRaw: $inputRaw, inputEncryption: $inputEncryption) }`;

class AssetBench {
  constructor(options) {
    const { pk, chainId, gap, url, receiver } = options;
    const muta = new Muta({
      chainId,
      timeoutGap: gap,
      endpoint: url
    });

    this.client = muta.client();
    this.account = Muta.accountFromPrivateKey(pk);
    this.service = new AssetService(this.client, this.account);

    this.chainId = chainId;

    this.to = randomBytes(20).toString("hex");
    this.receiver = receiver;
    this.gap = gap;
  }

  async createAsset() {
    const asset = await this.service.createAsset({
      supply: 99999999,
      symbol: Math.random().toString(),
      name: Math.random().toString()
    });
    this.assetId = asset.asset_id;
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
    this.startBalance = await this.service.getBalance(this.assetId);
  }

  async end() {
    this.endTime = Date.now();

    await this.client.waitForNextNBlock(1);

    this.endBlock = await this.client.getLatestBlockHeight();
    this.endBalance = await this.service.getBalance(this.assetId);

    const blocks = {};
    for (let height = this.startBlock; height <= this.endBlock; height++) {
      const res = await this.client.rawClient.getBlock({ height: utils.toHex(height) });

      blocks[height] = {
        round: Number("0x" + res.getBlock.header.proof.round),
        timeStamp: Number("0x" + res.getBlock.header.timestamp + "000"),
        transactionsCount: res.getBlock.orderedTxHashes.length
      };
    }

    return {
      timeUsage: this.endTime - this.startTime,
      // (- 1) is for wait 1 block to ensure all tx are finished
      blockUsage: this.endBlock - this.startBlock - 1,
      transferProcessed: this.startBalance - this.endBalance,

      blocks
    };
  }

  produceRequestBody() {
    const timeout = this.timeout;
    const chainId = this.chainId;

    const assetId = this.assetId;
    const to = this.to;

    const variables = utils.signTransaction(
      {
        serviceName: "asset",
        method: "transfer",
        payload: JSON.stringify({ asset_id: assetId, to: to, value: 1 }),
        timeout: timeout,
        nonce: `0x${randomBytes(32).toString("hex")}`,
        chainId: `${chainId}`,
        cyclesPrice: "0x01",
        cyclesLimit: "0x5208"
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
