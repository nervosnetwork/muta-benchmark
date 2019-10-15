#!/usr/bin/env node

const program = require("commander");
const runBenchmark = require("./bench");

const { args } = program
  .option("-m --method [method]", "HTTP method", "POST")
  .option("-d --duration [duration]", "number of second", 5)
  .option("-g --gap [gap]", "muta's timeout_gap", 30)
  .name("muta-bench")
  .usage("-m POST -d 60 http://127.0.0.1:8000/graphql")
  .parse(process.argv);

const opts = program.opts();
const url = args[0] || "http://127.0.0.1:8000/graphql";

runBenchmark({ ...opts, url }).then(({ errorCount }) => {
  if (errorCount > 0) {
    console.error(`HTTP success but GraphQL error count: ${errorCount}`);
  }
});
