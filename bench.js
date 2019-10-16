const random = require("random-bigint");
const autocannon = require("autocannon");
const axios = require("axios");
const sign = require("./sign");

const privateKey = Buffer.from("45c56be699dca666191ad3446897e0f480da234da896270202514a0e1a587c3f", "hex");
const chainId = "0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036";
const feeAssetId = "0xfee0decb4f6a76d402f200b5642a9236ba455c22aa80ef82d69fc70ea5ba20b5";
const carryingAssetId = "0xfee0decb4f6a76d402f200b5642a9236ba455c22aa80ef82d69fc70ea5ba20b5";
const receiver = "0x103e9b982b443592ffc3d4c2a484c220fb3e29e2e4";

let errorCount = 0;
let timeout = "0xffff";
let url;

function getBody() {
  return JSON.stringify({
    query: sign(
      {
        carryingAssetId,
        chainId,
        feeAssetId,
        feeCycle: "0xff",
        receiver,
        nonce:
          "0x" +
          random(128)
            .toString(16)
            .padStart(64, "0"),
        timeout,
        carryingAmount: "0x01"
      },
      privateKey
    )
  });
}

async function fetchEpochHeight() {
  const epochIdRes = await axios.post(url, { query: "query { getLatestEpoch { header { epochId } } }" });
  return Number("0x" + epochIdRes.data.data.getLatestEpoch.header.epochId);
}

async function fetchAccountBalance(account = receiver, asset = carryingAssetId) {
  const balanceRes = await axios.post(url, {
    query: `query { getBalance(address: "${receiver}", id: "${carryingAssetId}") }`
  });
  return Number("0x" + balanceRes.data.data.getBalance);
}

function round(x) {
  return parseFloat(Math.round(x * 100) / 100).toFixed(2);
}

async function bench(options) {
  const { gap } = options;
  url = options.url;
  const balance = await fetchAccountBalance();
  const height = await fetchEpochHeight();
  timeout = "0x" + Number(height + Number(gap) - 1).toString(16);

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        ...options,
        setupClient(client) {
          client.setBody(getBody());
        }
      },
      finishedBench
    );

    autocannon.track(instance);

    instance.on("response", function(client, statusCode, returnBytes, responseTime) {
      const res = client.parser.chunk.toString();
      const isError = res.includes("error");
      if (isError) {
        errorCount++;
      }
      client.setBody(getBody());
    });

    instance.on("done", async function({ start, duration }) {
      const endHeight = await fetchEpochHeight();
      const endBalance = await fetchAccountBalance();

      const txCount = endBalance - balance;
      const epochCount = endHeight - height;

      const Table = require("cli-table3");
      const table = new Table({ head: ["", "balance", "epoch height"] });
      table.push({ init: [balance, height] }, { done: [endBalance, endHeight] });

      console.log("TPS:");
      console.log(table.toString());
      console.log(`${round(txCount / epochCount)} tx/epoch`);
      console.log(`${round(duration / epochCount)} sec/epoch`);
      console.log(`${round(txCount / duration)} tx/sec`);
    });

    function finishedBench(err, res) {
      if (err) reject(err);
      else resolve({ errorCount });
    }
  });
}

module.exports = bench;
