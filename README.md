# Muta benchmark

## Requirement

- NodeJS >= 10

## Quick start

```shell
git clone https://github.com/homura/muta-benchmark.git
cd muta-benchmark
npm install
node index -d 5 http://127.0.0.1:8000/graphql

```

or install globally

```
git clone https://github.com/homura/muta-benchmark.git
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
  --receiver [receiver]           transfer receiver (default: "0x103e9b982b443592ffc3d4c2a484c220fb3e29e2e4")
  --verbose                       show verbose info, use it for debug (default: false)
  -h, --help                      output usage information
```

## Q&A

### what can I do when unknown error appeared?

Try to use `--verbose` for more bench information