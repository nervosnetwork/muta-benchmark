import { Worker } from 'worker_threads';

const logger = require('debug');
const debug = logger('bench:producer');

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ProducerOption<Data = any> {
  workerPath: string;
  workerCount: number;
  maxPoolSize: number;
  workerData: Data;
}

class TxProducer {
  maxPoolSize = 1000000;

  txPool: string[] = [];

  workers: Worker[];

  constructor(options: ProducerOption) {
    const { workerCount, maxPoolSize, workerPath, workerData } = options;

    if (maxPoolSize) {
      this.maxPoolSize = maxPoolSize;
    }

    this.workers = Array.from({ length: workerCount }).map(() => {
      const worker = new Worker(workerPath, {
        workerData,
      });

      worker.on('message', body => {
        const txPoolSize = this.txPool.length;
        if (txPoolSize >= this.maxPoolSize) {
          return;
        }

        this.txPool = this.txPool.concat(body);
      });

      return worker;
    });
  }

  terminate() {
    return Promise.all(
      this.workers.map(
        worker =>
          new Promise(resolve => {
            worker.postMessage('terminate');
            worker.on('message', message => {
              if (message === 'terminate') {
                resolve();
              }
            });
          }),
      ),
    );
  }

  async prepareNTx(size: number) {
    if (size >= this.maxPoolSize) {
      throw new Error(`prepare size ${size} can not over the maxPoolSize ${this.maxPoolSize}`);
    }

    while (this.txPool.length <= size) {
      await wait(500);
      debug(`prepared ${this.txPool.length} tx in pool`);
    }
  }

  async getBody() {
    return new Promise(resolve => {
      if (this.txPool.length) {
        resolve(this.txPool.shift());
      }
      setImmediate(() => {
        resolve(this.getBody());
      });
    });
  }

  getCurrentPoolSize() {
    return this.txPool.length;
  }

  getBodySync() {
    return this.txPool.shift();
  }
}

export { TxProducer };
