const secp256k1 = require("secp256k1");
const RLP = require("rlp");
const createKeccakHash = require("keccak");

const hash = msg =>
  createKeccakHash("keccak256")
    .update(msg)
    .digest();

const toHex = buf => "0x" + buf.toString("hex");

function sign(transaction, privateKey) {
  const tx = transaction;

  let orderedTx = [tx.chainId, tx.feeCycle, tx.feeAssetId, tx.nonce, tx.timeout];
  orderedTx = orderedTx.concat([tx.carryingAmount, tx.carryingAssetId, tx.receiver]);

  const encoded = RLP.encode(orderedTx);
  const txHash = hash(encoded);

  const pubkey = secp256k1.publicKeyCreate(privateKey);
  const { signature } = secp256k1.sign(txHash, privateKey);
  return {
    txHash: toHex(txHash),
    pubkey: toHex(pubkey),
    signature: toHex(signature)
  };
}

function toGQL(tx, privateKey) {
  const signed = sign(tx, privateKey);

  return `mutation {
    sendTransferTransaction(
        inputRaw: {
            chainId: "${tx.chainId}", 
            feeCycle: "${tx.feeCycle}", 
            feeAssetId: "${tx.feeAssetId}", 
            nonce: "${tx.nonce}", 
            timeout: "${tx.timeout}"
          },
          inputAction: {
              carryingAmount: "${tx.carryingAmount}",
              carryingAssetId: "${tx.carryingAssetId}",
              receiver: "${tx.receiver}",
          }, 
          inputEncryption: {
             txHash: "${signed.txHash}",
             pubkey: "${signed.pubkey}",
             signature: "${signed.signature}"
    }
)}`;
}

module.exports = toGQL;
