#!/usr/bin/env node

const program = require("commander");
const ora = require("ora");
const cluster = require("cluster");
const { runMain, runWorker } = require("./bench");
const logger = require("./logger");
const { AssetBenchProducer } = require("./BenchProducer");

const { args } = program
  .option("-m --method [method]", "HTTP method", "POST")
  .option("-d --duration [duration]", "number of second", 60)
  .option("-g --gap [gap]", "muta's timeout_gap", 20)
  .option("-c --connections [connections]", "number of connection", 20)
  .option(
    "--pk [privateKey]",
    "sender of the transfer",
    process.env.PRIVATE_KEY || "0x45c56be699dca666191ad3446897e0f480da234da896270202514a0e1a587c3f"
  )
  .option("--chain-id [chainId]", "chain id", "0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036")
  .option("--receiver [receiver]", "receiver of the transfer", "0x103e9b982b443592ffc3d4c2a484c220fb3e29e2e4")
  .option("--verbose", "show verbose info, use it for debug", false)
  .option("--cpu [cpu]", "cpu nums", 3)
  .option("--json", "print output as json", false)
  .name("muta-bench")
  .usage(
    "-m POST -d 60 -c 20 --gap 30 --receiver 0x1000000000000000000000000000000000000000 --pk 0x45c56be699dca666191ad3446897e0f480da234da896270202514a0e1a587c3f http://127.0.0.1:8000/graphql"
  )
  .parse(process.argv);

const opts = program.opts();
const url = args[0] || "http://127.0.0.1:8000/graphql";

opts.url = url;

if (opts.verbose) {
  logger.enable("*");
}

if (cluster.isMaster) {
  run()
    .catch(({ errorCount }) => {
      if (errorCount > 0) {
        console.error(`HTTP success but GraphQL error count: ${errorCount}`);
      }
    });
} else {
  runWorker();
}

async function run() {
  const { gap, pk, url, receiver, chainId } = opts;
  const assetBenchProducer = new AssetBenchProducer({
    pk,
    chainId,
    gap,
    url,
    receiver
  });

  const createAssetSpin = ora("Creating asset").start();
  try {
    const asset = await assetBenchProducer.createAsset();
    createAssetSpin.succeed(`Created asset ${JSON.stringify(asset)}`);
  } catch (e) {
    createAssetSpin.fail(`Asset create failed, ${e.message}`);
  }

  await assetBenchProducer.prepare();

  opts.headers = {};
  opts.headers['Content-Type'] = "application/json";

  const workers = Array.from({ length: opts.cpu }).map(() => {
    const worker = cluster.fork({
      WORKER_DATA: JSON.stringify({
        assetId: assetBenchProducer.assetId,
        to: assetBenchProducer.to,
        timeout: assetBenchProducer.timeout,
        chainId: assetBenchProducer.chainId,
        privateKey: assetBenchProducer.account._privateKey.toString("hex")
      }),
      OPTIONS: JSON.stringify(opts)
    });

    worker.on("exit", () => console.log("worker done"));
    worker.on("error", err => console.log("worker error", err));

    return worker;
  });

  return runMain(assetBenchProducer, workers, opts);
}
