const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const bitcoin = require("bitcoinjs-lib");
const bn = require("bn.js");
const ec = require('elliptic').ec;
const secp256k1 = new ec("secp256k1");
const ecSignature = require("elliptic/lib/elliptic/ec/signature");
const shell = require('shelljs');

Buffer.prototype.importDER = function _importDER() {
    class Position {
        constructor() {
            this.place = 0;
        }
    }

    function getLength(buf, p) {
        var initial = buf[p.place++];
        if (!(initial & 0x80)) {
            return initial;
        }
        var octetLen = initial & 0xf;
        var val = 0;
        for (var i = 0, off = p.place; i < octetLen; i++, off++) {
            val <<= 8;
            val |= buf[off];
        }
        p.place = off;
        return val;
    }


    const BN = bn;
    let data = this;
    var p = new Position();
    if (data[p.place++] !== 0x30) {
        console.log("Not DER compatible");
        return false;
    }
    var len = getLength(data, p);
    if ((len + p.place) !== data.length) {
        //console.log(`Illegal length 1 want: ${len + p.place}`);
        data = data.slice(0, len + p.place);
    }
    if (data[p.place++] !== 0x02) {
        console.log("Illegal byte coming 1");
        return false;
    }
    var rlen = getLength(data, p);
    var r = data.slice(p.place, rlen + p.place);
    p.place += rlen;
    if (data[p.place++] !== 0x02) {
        console.log("Illegal byte coming 2");
        return false;
    }
    var slen = getLength(data, p);
    if (data.length !== slen + p.place) {
        console.log("Illegal length 2");
        return false;
    }
    var s = data.slice(p.place, slen + p.place);
    if (r[0] === 0 && (r[1] & 0x80)) {
        r = r.slice(1);
    }
    if (s[0] === 0 && (s[1] & 0x80)) {
        s = s.slice(1);
    }

    this.r = new BN(r);
    this.s = new BN(s);

    return [this.r, this.s];
};

const cachePath = path.join(process.cwd(), "caches");
try {
    shell.mkdir('-p', cachePath);
} catch (e) {}
const lastBlockPath = path.join(cachePath, "last");
const endPoints = [
    "https://mona.monacoin.ml/insight-api-monacoin",
    "https://mona.insight.monaco-ex.org/insight-api-monacoin",
    "https://insight.electrum-mona.org/insight-api-monacoin",
    "https://mona.chainsight.info/api"
];

const endPointOffset = 0;
async function request(path) {
    while (true) {
        try {
            return (await axios(`${endPoints[endPointOffset]}${path}`)).data;
        } catch (e) {
            endPointOffset = (endPointOffset + 1) % endPoints.length;
        }
    }
}

function writePath(pubKey, signature, txHash, vin) {
    const sigR = new ecSignature(signature).r.toBuffer();
    // hash pubKey and r of signature
    let hash = crypto.createHash('sha256');
    const pubSig = hash.update(pubKey).digest(sigR).toString("hex").substring(0, 10);
    // hash txHash and vin
    hash = crypto.createHash('sha256');
    const txVin = hash.update(Buffer.from(txHash, "hex")).digest(new bn(vin).toBuffer()).toString("hex").substring(0, 10);
    // cachePath/pubSig/txVin
    const finalPath = path.join(cachePath, pubSig, txVin);
    try {
        shell.mkdir('-p', finalPath);
    } catch (e) {}
    return finalPath;
}

(async () => {
    let currentBlock;
    if (fs.existsSync(lastBlockPath)) {
        console.log('Reading states...');
        currentBlock = fs.readFileSync(lastBlockPath).toString('utf8').trim();
    } else {
        console.log('Fetching block hash at #1...')
        currentBlock = (await request(`/block-index/1`)).blockHash;
    }
    console.log(`Starting at ${currentBlock}`)
    while (currentBlock) {
        const blockInfo = await request(`/block/${currentBlock}`);
        if (blockInfo.tx.length !== 1) {
            console.log(`Processing ${currentBlock} (#${blockInfo.height})`);
            // The first one is coinbase, so skip
            const rawBlock = (await request(`/rawblock/${currentBlock}`)).rawblock;
            const rawBlockBuffer = Buffer.from(rawBlock, 'hex');
            const loadedBlock = bitcoin.Block.fromBuffer(rawBlockBuffer);
            for (let loaded of loadedBlock.transactions.slice(1)) {
                const txId = loaded.getId();
                const builder = bitcoin.TransactionBuilder.fromTransaction(loaded);
                for (let vin in builder.inputs) {
                    vin = parseInt(vin);
                    console.log(`Writing down ${txId.slice(0,10)}... of input #${vin}`)
                    const input = builder.inputs[vin];
                    const input2 = loaded.ins[vin];
                    let signatureHash; // the message
                    if (input.witness) {
                        signatureHash = loaded.hashForWitnessV0(vin, input2.script, input.value, bitcoin.Transaction.SIGHASH_ALL);
                    } else {
                        signatureHash = loaded.hashForSignature(vin, input2.script, bitcoin.Transaction.SIGHASH_ALL);
                    }
                    for (let sig of input.signatures) {
                        sig.importDER();
                        const pubKey = secp256k1.recoverPubKey(signatureHash, sig, 0).x.toBuffer();
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