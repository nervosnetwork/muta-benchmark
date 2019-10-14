const random = require("random-bigint");
const autocannon = require("autocannon");
const sign = require("./sign");

const privateKey = Buffer.from("67df77adbc271f558df88504cf3a3f87bfdd2d55b11e86c55c4fd978a935a836", "hex");
const chainId = "0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036";
const feeAssetId = "0x20360d5c4c9b85b25af54cde365861d463484a9e59759093370a2d2463ad5a53";
const carryingAssetId = "0x20360d5c4c9b85b25af54cde365860d463484a9e59759093370a2d2463ad5a53";
const receiver = "0x10360d5c4c9b85b25af54cde365860d463484a9e45";

let errorCount = 0;

function getBody() {
  return JSON.stringify({
    query: sign(
      {
        carryingAssetId,
        chainId,
        feeAssetId,
        feeCycle: "0xff",
        receiver,
        nonce: "0x" + random(128).toString(16).padStart(64, "0"),
        timeout: "0x8888",
        carryingAmount: "0xff"
      },
      privateKey
    )
  });
}

function bench(options) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        connections: 400,
        duration: 5,
        ...options,
        method: "POST",
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

    function finishedBench(err, res) {
      if (err) reject(err);
      else resolve({ errorCount });
    }
  });
}

module.exports = bench;
