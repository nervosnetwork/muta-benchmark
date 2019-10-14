#!/usr/bin/env node

// const inquirer = require("inquirer");
// let runBenchmark = require("./bench");
//
// inquirer
//   .prompt([
//     {
//       name: "url",
//       message: "MUTA graphql endpoint",
//       default: "http://127.0.0.1:8000/graphql"
//     },
//     {
//       name: "duration",
//       type: "number",
//       message: "The number of seconds to run the test",
//       default: 60
//     }
//   ])
//   .then(answers => {
//     runBenchmark(answers).then(({ errorCount }) => {
//       if (errorCount > 0) {
//         console.error(`HTTP success but GraphQL error count: ${errorCount}`);
//       }
//     });
//   });

const program = require("commander");
const runBenchmark = require("./bench");

const { args } = program
  .option("-m --method [method]", "HTTP method", "POST")
  .option("-d --duration [duration]", "number of second", 60)
  .name("muta-bench")
  .usage("-m POST -d 60 http://127.0.0.1/graphql")
  .parse(process.argv);

const opts = program.opts();

runBenchmark({ ...opts, url: args[0] }).then(({ errorCount }) => {
  if (errorCount > 0) {
    console.error(`HTTP success but GraphQL error count: ${errorCount}`);
  }
});
