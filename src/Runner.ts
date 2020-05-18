import autocannon from 'autocannon';
import { Adapter } from './adapters/BaseBenchAdapter';
import { useContext } from './context';

interface RunnerConfig {
  /* path of the adapter */
  adapter: string;
}

class BenchRunner {
  private graphErrorCount = 0;

  onGraphQLError() {
    this.graphErrorCount++;
  }

  async run() {
    const path = useContext().getAdapterPath();
    const AdapterClass: typeof Adapter = require(path)['Adapter'];
    // @ts-ignore
    const adapter: Adapter = new AdapterClass(useContext().getAdapterConfig());
    await adapter.onBenchWillStart();

    const instance = await autocannon(
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        ...useContext().getCannonOptions(),
      },
      () => {},
    );

    autocannon.track(instance);

    instance.on('response', async (client, x) => {
      // @ts-ignore
      if (client.parser.chunk.includes('Error')) {
        this.onGraphQLError();
      }

      const body = await adapter.getBodySync();
      client.setBody(body);
    });
    instance.on('done', async () => {
      await adapter.onBenchFinish();
      if (this.graphErrorCount) {
        console.log(`graphql error ${this.graphErrorCount}`);
      }
    });
  }
}

export { BenchRunner };
