const autocannon = require("autocannon");
const ora = require("ora");
const logger = require("./logger");
const { AssetBenchProducer } = require("./BenchProducer");

function round(x) {
  return parseFloat(Math.round(x * 100) / 100).toFixed(2);
}

async function bench(options) {
  let errorCount = 0;

  const { gap, pk, assetId, url, receiver, chainId } = options;
  const assetBenchProducer = new AssetBenchProducer({
    pk,
    chainId,
    gap,
    url,
    assetId,
    receiver
  });

  if (!assetId) {
    const createAssetSpin = ora("Creating asset").start();
    try {
      const asset = await assetBenchProducer.createAsset();
      createAssetSpin.succeed(`Created asset ${JSON.stringify(asset)}`);
    } catch (e) {
      createAssetSpin.fail(`Asset create failed, ${e.message}`);
    }
  }
  await assetBenchProducer.start();

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        ...options,
        setupClient(client) {
          client.setBody(assetBenchProducer.produceRequestBody());
        }
      },
      finishedBench
    );

    autocannon.track(instance);

    instance.on("response", function(client, statusCode, returnBytes, responseTime) {
      const res = client.parser.chunk.toString();
      const isError = res.includes("error");
      if (isError) {
        logger.error(res);
        errorCount++;
      }
      client.setBody(assetBenchProducer.produceRequestBody());
    });

    instance.on("done", async function({ start, duration }) {
      const spin = ora("TPS is calculating ").start();
      const { epochUsage, transferProcessed } = await assetBenchProducer.end();
      spin.stop();

      const txCount = transferProcessed;
      const epochCount = epochUsage;

      const Table = require("cli-table3");
      const table = new Table({ head: ["", "balance", "epoch height"] });
      table.push(
        { init: [assetBenchProducer.startBalance, assetBenchProducer.startEpoch] },
        { done: [assetBenchProducer.endBalance, assetBenchProducer.endEpoch] }
      );

      console.log("TPS:");
      console.log(table.toString());
      console.log(`${round(txCount / epochCount)} tx/epoch`);
      console.log(`${round(duration / epochCount)} sec/epoch`);
      console.log(`${round(txCount / duration)} tx/sec`);
    });

    function finishedBench(err) {
      if (err) reject(err);
      else resolve({ errorCount });
    }
  });
}

module.exports = bench;
