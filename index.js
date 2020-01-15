#!/usr/bin/env node

const program = require("commander");
const runBenchmark = require("./bench");
const logger = require("./logger");

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
  .option("--pre-sign-count [preSignCount]", "pre sign for performance", 10000)
  .option("--tx-per-sec [txPerSec]", "max transaction per second", 99999999)
  .option("--chain-id [chainId]", "chain id", "0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036")
  .option("--receiver [receiver]", "receiver of the transfer", "0x103e9b982b443592ffc3d4c2a484c220fb3e29e2e4")
  .option("--verbose", "show verbose info, use it for debug", false)
  .name("muta-bench")
  .usage(
    "-m POST -d 60 -c 20 --gap 30 --receiver 0x1000000000000000000000000000000000000000 --pk 0x45c56be699dca666191ad3446897e0f480da234da896270202514a0e1a587c3f http://127.0.0.1:8000/graphql"
  )
  .parse(process.argv);

const opts = program.opts();
const url = args[0] || "http://127.0.0.1:8000/graphql";

if (opts.verbose) {
  logger.enable("*");
}

runBenchmark({ ...opts, url, assetId: opts.asset }).then(({ errorCount }) => {
  if (errorCount > 0) {
    console.error(`HTTP success but GraphQL error count: ${errorCount}`);
  }
});
