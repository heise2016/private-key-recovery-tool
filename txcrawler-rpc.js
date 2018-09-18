const crypto = require("crypto");
const path = require("path");
const bitcoin = require("bitcoinjs-lib");
const bn = require("bn.js");
const ec = require('elliptic').ec;
const secp256k1 = new ec("secp256k1");
const ecSignature = require("elliptic/lib/elliptic/ec/signature");
const shell = require('shelljs');
const leveldown = require('leveldown');
const levelup = require('levelup');
const api = require('./api');
const writePath = require("./writepath");
require("./buffer-importder");

const cachePath = path.join(process.cwd(), "caches");
try {
    shell.mkdir('-p', cachePath);
} catch (e) {}
const db = levelup(leveldown(cachePath));

const request = api.default;

process.on('SIGINT', () => {
    db.close();
    process.exit();
});

function normalFinish(a) {
    console.log(a);
    db.close();
}

(async () => {
    let currentBlock;
    console.log('Reading states...');
    try {
        currentBlock = await db.get('last', {
            asBuffer: false
        });
    } catch (e) {
        currentBlock = (await request(`/block-index/1`)).blockHash;
    }
    console.log(`Starting at ${currentBlock}`);
    while (currentBlock) {
        const blockInfo = await request(`/block/${currentBlock}`);
        const height = blockInfo.height + blockInfo.confirmations - 1;
        const progress = Math.floor(blockInfo.height / height * 10000) / 100;
        if (blockInfo.tx.length !== 1) {
            console.log(`Processing ${currentBlock} (#${blockInfo.height} ${progress}%)`);
            // The first one is coinbase, so skip
            const rawBlock = (await request(`/rawblock/${currentBlock}`)).rawblock;
            const rawBlockBuffer = Buffer.from(rawBlock, 'hex');
            const loadedBlock = bitcoin.Block.fromBuffer(rawBlockBuffer);
            let batch = db.batch();
            for (let loaded of loadedBlock.transactions.slice(1)) {
                const txId = loaded.getId();
                const builder = bitcoin.TransactionBuilder.fromTransaction(loaded);
                for (let vin in builder.inputs) {
                    vin = parseInt(vin);
                    const input = builder.inputs[vin];
                    const input2 = loaded.ins[vin];
                    console.log(`Writing down ${txId.slice(0,10)}... of input #${vin}; signatures: ${input.signatures.length}`)
                    let signatureHash; // the message
                    if (input.witness) {
                        signatureHash = loaded.hashForWitnessV0(vin, input2.script, input.value, bitcoin.Transaction.SIGHASH_ALL);
                    } else {
                        signatureHash = loaded.hashForSignature(vin, input2.script, bitcoin.Transaction.SIGHASH_ALL);
                    }
                    for (let sig of input.signatures) {
                        if (!Buffer.isBuffer(sig)) {
                            continue;
                        }
                        sig.importDER();
                        const pubKey = secp256k1.recoverPubKey(signatureHash, sig, 0).x.toBuffer();
                        const dir = writePath(pubKey, sig, txId, vin);
                        batch = batch
                            .put(`${dir}/signature`, sig)
                            .put(`${dir}/message`, signatureHash);
                    }
                }
            }
            await batch.write();
        } else {
            console.log(`Skipped ${currentBlock} (#${blockInfo.height} ${progress}%)`);
        }
        currentBlock = blockInfo.nextblockhash;
        if (blockInfo.height % 10 == 0) {
            await db.batch()
                .put('last', currentBlock)
                .put('last/height', `${blockInfo.height}`)
                .write();
        }
    }
})().then(normalFinish, normalFinish);