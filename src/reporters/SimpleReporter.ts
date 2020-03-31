abstract class SimpleReporter<Start = any, End = Start> {
  startObject!: Start;

  endObject!: End;

  abstract async produceStart(): Promise<Start>;

  abstract async produceEnd(): Promise<End>;

  abstract async report(start: Start, end: End): Promise<void>;

  async start() {
    this.startObject = await this.produceStart();
  }

  async end() {
    this.endObject = await this.produceEnd();
    this.report(this.startObject, this.endObject);
  }
}

export { SimpleReporter };
