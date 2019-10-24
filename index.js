#!/usr/bin/env node

const program = require("commander");
const runBenchmark = require("./bench");

const { args } = program
  .option("-m --method [method]", "HTTP method", "POST")
  .option("-d --duration [duration]", "number of second", 5)
  .option("-g --gap [gap]", "muta's timeout_gap", 20)
  .option("-c --connections [connections]", "number of connection", 20)
  .option("--receiver [receiver]", "transfer receiver", "0x103e9b982b443592ffc3d4c2a484c220fb3e29e2e4")
  .name("muta-bench")
  .usage(
    "-m POST -d 60 -c 20 --gap 30 --receiver 0x103e9b982b443592ffc3d4c2a484c220fb3e29e2e4 http://127.0.0.1:8000/graphql"
  )
  .parse(process.argv);

const opts = program.opts();
const url = args[0] || "http://127.0.0.1:8000/graphql";

runBenchmark({ ...opts, url }).then(({ errorCount }) => {
  if (errorCount > 0) {
    console.error(`HTTP success but GraphQL error count: ${errorCount}`);
  }
});
