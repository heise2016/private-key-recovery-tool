const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const bitcoin = require("bitcoinjs-lib");
const ecSignature = require("elliptic/lib/elliptic/ec/signature");
const bn = require("bn.js");
const ec = require('elliptic').ec;
const secp256k1 = new ec("secp256k1");

const cachePath = path.join(process.cwd(), "caches");
try {
    fs.mkdirSync(cachePath);
} catch (e) {}
const lastBlockPath = path.join(cachePath, "last");
const endPoint = "https://mona.insight.monaco-ex.org/insight-api-monacoin"

function writePath(pubKey, signature, txHash, vin) {
    const sigR = new ecSignature(signature).r.toBuffer();
    // hash pubKey and r of signature
    let hash = crypto.createHash('sha256');
    const pubSig = hash.update(pubKey).digest(sigR).toString("hex");
    // hash txHash and vin
    hash = crypto.createHash('sha256');
    const txVin = hash.update(Buffer.from(txHash, "hex")).digest(new bn(vin).toBuffer()).toString("hex");
    // cachePath/pubSig/txVin
    const finalPath = path.join(cachePath, pubSig, txVin);
    try {
        fs.mkdirSync(finalPath);
    } catch (e) {}
    return finalPath;
}

(async () => {
    let currentBlock;
    if (fs.existsSync(lastBlockPath)) {
        console.log('Reading states...');
        currentBlock = fs.readFileSync(lastBlockPath).toString('hex').trim();
    } else {
        console.log('Fetching block hash at #1...')
        currentBlock = (await axios.get(`${endPoint}/block-index/1`)).data.blockHash
    }
    console.log(`Starting at ${currentBlock}`)
    while (currentBlock) {
        const blockInfo = (await axios(`${endPoint}/block/${currentBlock}`)).data;
        if (blockInfo.tx.length !== 1) {
            console.log(`Processing ${currentBlock} (#${blockInfo.height})`);
            // The first one is coinbase, so skip
            const txs = blockInfo.tx.slice(1);
            for (let txId of txs) {
                const rawTxHex = (await axios(`${endPoint}/rawtx/${txId}`)).data.rawtx;
                const rawTxBuffer = Buffer.from(rawTxHex, 'hex');
                const loaded = bitcoin.Transaction.fromBuffer(rawTxBuffer);
                const builder = bitcoin.TransactionBuilder.fromTransaction(loaded);
                for (let vin in builder.inputs) {
                    console.log(`Writing down ${txId.slice(0,10)}... of input #${vin}`)
                    const input = builder.inputs[vin];
                    let signatureHash; // the message
                    if (input.witness) {
                        signatureHash = loaded.hashForWitnessV0(vin, input.signScript, input.value);
                    } else {
                        signatureHash = loaded.hashForSignature(vin, input.signScript);
                    }
                    for (let sig of input.signatures) {
                        const pubKey = secp256k1.recoverPubKey(signatureHash, sig);
                        const dir = writePath(pubKey, sig, txId, vin);
                        fs.writeFileSync(path.join(dir, "signature"), sig.toString("hex"));
                        fs.writeFileSync(path.join(dir, "message"), signatureHash.toString("hex"));
                    }
                }
            }
        } else {
            console.log(`Skipped ${currentBlock} (#${blockInfo.height})`);
        }
        currentBlock = blockInfo.nextblockhash;
        if (blockInfo.height % 10 == 0) {
            fs.writeFileSync(lastBlockPath, currentBlock);
        }
    }
})().then(console.log, console.log);