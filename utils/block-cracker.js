const ec = require('elliptic').ec;
const secp256k1 = new ec("secp256k1");
const bitcoin = require("bitcoinjs-lib");
const writePath = require("./writepath");
require("./buffer-importder");

module.exports = function (rawBlockBuffer) {
    const batch = [];

    const loadedBlock = bitcoin.Block.fromBuffer(rawBlockBuffer);
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
                batch.push({
                    type: 'put',
                    key: `${dir}/signature`,
                    value: sig
                }, {
                    type: 'put',
                    key: `${dir}/message`,
                    value: signatureHash
                });
            }
        }
    }

    return batch;
}