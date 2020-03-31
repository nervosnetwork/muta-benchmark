import { utils } from 'muta-sdk';
import randomBytes from 'randombytes';
import { parentPort, workerData } from 'worker_threads';
import { WorkerData } from './';

const bufferSize = 100;
let buffer: string[] = [];

let { chainId, timeout, privateKey, payload: payloadObj } = workerData as WorkerData;
const payload = JSON.stringify(payloadObj);
const query = `mutation ( $inputRaw: InputRawTransaction! $inputEncryption: InputTransactionEncryption! ) { sendTransaction(inputRaw: $inputRaw, inputEncryption: $inputEncryption) }`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// if terminate the worker directly, a `FATAL ERROR` will thrown from N-API module
parentPort!.on('message', message => {
  if (message === 'terminate') {
    parentPort?.postMessage('terminate');
    process.exit(0);
  }
});

if (privateKey.startsWith('0x')) {
  privateKey = privateKey.slice(2);
}

(async () => {
  while (1) {
    const signature = JSON.stringify({
      query,
      variables: utils.signTransaction(
        {
          serviceName: 'asset',
          method: 'transfer',
          payload: payload,
          timeout: timeout,
          nonce: `0x${randomBytes(32).toString('hex')}`,
          chainId,
          cyclesPrice: '0x01',
          cyclesLimit: '0x5208',
        },
        Buffer.from(privateKey, 'hex'),
      ),
    });

    buffer.push(signature);
    if (buffer.length >= bufferSize) {
      parentPort!.postMessage(buffer);
      buffer = [];
      await wait(0);
    }
  }
})();
