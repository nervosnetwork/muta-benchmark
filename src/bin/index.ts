#!/usr/bin/env node

import program from 'commander';
import { utils } from 'muta-sdk';
import { createContext } from '../context';
import { BenchRunner } from '../Runner';

const toNumber = (v: string) => parseInt(v);

program
  .option('-d --duration [duration]', 'number of second', toNumber, 60)
  .option('-c --connections [connections]', 'number of connection', toNumber, 20)
  .option(
    '--chain-id [chainId]',
    'the ChainID',
    utils.toHex,
    '0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036',
  )
  .option(
    '--pk [privateKey]',
    'signer private key',
    utils.toHex,
    process.env.PRIVATE_KEY || '0x2b672bb959fa7a852d7259b129b65aee9c83b39f427d6f7bded1f58c4c9310c2',
  )
  .option('--timeout-gap [timeoutGap]', "Muta's timeout_gap", toNumber, 20)
  .option('--verbose', 'show verbose info, use it for debug', false)
  .option('--cpu [cpu]', 'cpu nums', toNumber, 3)
  .option('--json', 'print output as json', false)
  .option('--adapter [adapter]', 'adapter path', require.resolve('../adapters/huobi-asset'))
  .option('--adapter-config [adapterConfig]', 'a json formatted string', '{}')
  .option('--endpoint [endpoint]', 'muta endpoint ', 'http://127.0.0.1:8000/graphql')
  .name('muta-bench')
  .version(require('../../package.json').version, '-v --version', 'output the current version')
  .usage('-d 60 -c 20 --gap 30 http://127.0.0.1:8000/graphql')
  .parse(process.argv);

const opts = program.opts();
console.log(opts);

createContext({
  duration: opts.duration,
  connections: opts.connections,
  url: opts.endpoint,

  chainId: opts.chainId,
  timeoutGap: opts.timeoutGap,

  cpu: opts.cpu,

  adapter: opts.adapter,
  adapterConfig: JSON.parse(opts.adapterConfig),

  privateKey: opts.pk,
});

new BenchRunner().run();
