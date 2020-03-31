# Muta benchmark

A general Muta RPC performance testing framework

##

## Requirement

- NodeJS >= 12

## Quick start

```shell
git clone https://github.com/nervosnetwork/muta-benchmark.git
cd muta-benchmark
npm install
node index -d 5 http://127.0.0.1:8000/graphql
```

or install globally

```
git clone https://github.com/nervosnetwork/muta-benchmark.git
cd muta-benchmark
npm install
[sudo] npm link
muta-bench -d 5 http://127.0.0.1:8000/graphql
```

## Options

```
Usage: muta-bench -d 60 -c 20 --gap 30 http://127.0.0.1:8000/graphql

Options:
  -d --duration [duration]          number of second (default: 60)
  -c --connections [connections]    number of connection (default: 20)
  --chain-id [chainId]              the ChainID (default: "0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036")
  --pk [privateKey]                 signer private key (default: "0x2b672bb959fa7a852d7259b129b65aee9c83b39f427d6f7bded1f58c4c9310c2")
  --timeout-gap [timeoutGap]        Muta's timeout_gap (default: 20)
  --verbose                         show verbose info, use it for debug (default: false)
  --cpu [cpu]                       cpu nums (default: 3)
  --json                            print output as json (default: false)
  --adapter [adapter]               adapter path (default: "./build/adapters/huobi-asset/index.js")
  --adapter-config [adapterConfig]  a json formatted string (default: "{}")
  --endpoint [endpoint]             muta endpoint  (default: "http://127.0.0.1:8000/graphql")
  -v --version                      output the current version
  -h, --help                        output usage information

```

## Q&A

### What can I do when unknown error appeared?

Try to use `--verbose` for more bench information

### How to customize private key of the sender?

- use environment variable `PRIVATE_KEY=0x...`
- or use `--pk 0x...` option
