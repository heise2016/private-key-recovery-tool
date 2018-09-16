const guessor = require("./guessor");
const leveldown = require('leveldown');
const levelup = require('levelup');
const bitcoin = require("bitcoinjs-lib");
const bigi = require("bigi");
const ItrWrapper = require("./lvldwnitr-wrapper");
const coins = require('./coins');

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
        valueAsBuffer: false
    }));
    const found = {};
    const wifs = [];
    const skips = ["last"];
    try {
        while (true) {
            const {
                key,
                value
            } = await iter.next();
            if (key === undefined) {
                break;
            }
            const keyCut = key.split("/");
            if (skips.indexOf(keyCut[0]) >= 0) {
                continue;
            }
            if (key.endsWith("/wif") && keyCut.length == 2) {
                wifs.push(value);
                skips.push(keyCut[0]);
                continue;
            }
            if (key.endsWith("/message") || keyCut.length != 3 || key == "last") {
                continue;
            }
            const [pubSig, txVin] = keyCut;
            if (!found[pubSig]) {
                console.log(`Indexed: ${pubSig} ${txVin}`);
                found[pubSig] = txVin;
            } else if ("string" === typeof found[pubSig] && found[pubSig] != txVin) {
                // found!!!
                console.log(`Found: ${pubSig} ${txVin}`);
                const firstName = found[pubSig];
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
                    delete found[pubSig];
                    skips.push(pubSig);
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
}).then(normalFinish, normalFinish);