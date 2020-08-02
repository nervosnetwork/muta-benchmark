#!/usr/bin/env node

const program = require('commander');
const ora = require('ora');
const cluster = require('cluster');
const { utils, Account } = require('@mutadev/muta-sdk');
const { runMain, runWorker } = require('./bench');
const logger = require('./logger');
const { AssetBenchProducer } = require('./BenchProducer');

const toNumber = (v) => parseInt(v);

const receiverAccount = new Account(
  '0x0000000000000000000000000000000000000000000000000000000000000001'
);

const { args } = program
  .option('-m --method [method]', 'HTTP method', 'POST')
  .option('-d --duration [duration]', 'number of second', toNumber, 60)
  .option('-g --gap [gap]', "muta's timeout_gap", toNumber, 20)
  .option(
    '-c --connections [connections]',
    'number of connection',
    toNumber,
    20
  )
  .option(
    '--pk [privateKey]',
    'sender of the transfer',
    utils.toHex,
    process.env.PRIVATE_KEY ||
      '0x45c56be699dca666191ad3446897e0f480da234da896270202514a0e1a587c3f'
  )
  .option(
    '--chain-id [chainId]',
    'chain id',
    utils.toHex,
    '0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036'
  )
  .option(
    '--receiver [receiver]',
    'receiver of the transfer',
    utils.toHex,
    receiverAccount.address
  )
  .option('--verbose', 'show verbose info, use it for debug', false)
  .option('--cpu [cpu]', 'cpu nums', toNumber, 3)
  .option('--json', 'print output as json', false)
  .name('muta-bench')
  .usage(
    '-m POST -d 60 -c 20 --gap 30 --pk 0x45c56be699dca666191ad3446897e0f480da234da896270202514a0e1a587c3f http://127.0.0.1:8000/graphql'
  )
  .parse(process.argv);

const opts = program.opts();
const url = args.length ? args : 'http://127.0.0.1:8000/graphql';

opts.url = url;

if (opts.verbose) {
  logger.enable('*');
}

if (cluster.isMaster) {
  run().catch(({ errorCount }) => {
    if (errorCount > 0) {
      console.error(`HTTP success but GraphQL error count: ${errorCount}`);
    }
  });
} else {
  runWorker();
}

async function run() {
  console.log(opts);
  const { gap, pk, url, receiver, chainId } = opts;
  const assetBenchProducer = new AssetBenchProducer({
    pk,
    chainId,
    gap,
    url,
    receiver,
  });

  const createAssetSpin = ora('Creating asset').start();
  try {
    const asset = await assetBenchProducer.createAsset();
    createAssetSpin.succeed(`Created asset ${JSON.stringify(asset)}`);
  } catch (e) {
    createAssetSpin.fail(`Asset create failed, ${e.message}`);
  }

  await assetBenchProducer.prepare();

  opts.headers = {};
  opts.headers['Content-Type'] = 'application/json';

  const workers = Array.from({ length: opts.cpu }).map(() => {
    const worker = cluster.fork({
      WORKER_DATA: JSON.stringify({
        assetId: assetBenchProducer.assetId,
        to: assetBenchProducer.to,
        timeout: assetBenchProducer.timeout,
        chainId: assetBenchProducer.chainId,
        privateKey: assetBenchProducer.account._privateKey.toString('hex'),
        sender: assetBenchProducer.account.address,
      }),
      OPTIONS: JSON.stringify(opts),
    });

    worker.on('exit', () => console.log('worker done'));
    worker.on('error', (err) => console.log('worker error', err));

    return worker;
  });

  return runMain(assetBenchProducer, workers, opts);
}
