# Muta benchmark

## Requirement

- NodeJS >= 10

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
Options:
  -m --method [method]            HTTP method (default: "POST")
  -d --duration [duration]        number of second (default: 5)
  -g --gap [gap]                  muta's timeout_gap (default: 20)
  -c --connections [connections]  number of connection (default: 20)
  --pk [privateKey]               sender of the transfer
  --receiver [receiver]           receiver of the transfer
  --verbose                       show verbose info, use it for debug (default: false)
  -h, --help                      output usage information
```

## Q&A

### What can I do when unknown error appeared?

Try to use `--verbose` for more bench information

### How to customize private key of the sender?

- use environment variable `PRIVATE_KEY=0x...`
- or use `--pk 0x...` option

### How to run with multiple nodes

```
# each node will be allocated 15 connections
muta-bench -c 30 http://127.0.0.1:8000/graphql http://127.0.0.1:8001/graphql
```

It is recommended to adjust the number of connections to n times the number of nodes