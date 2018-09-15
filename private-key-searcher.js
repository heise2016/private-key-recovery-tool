const guessor = require("./guessor");
const leveldown = require('leveldown');
const levelup = require('levelup');
const bitcoin = require("bitcoinjs-lib");
const bigi = require("bigi");
const ItrWrapper = require("./lvldwnitr-wrapper");

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

const network = {
    messagePrefix: '\x19Monacoin Signed Message:\n',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
    },
    pubKeyHash: 50,
    scriptHash: 55,
    wif: 178, //new wif
    bech32: "mona"
};

(async () => {
    const iter = new ItrWrapper(db.iterator());
    const found = {};
    const wifs = [];
    try {
        while (true) {
            const {
                key,
                value
            } = await iter.next();
            if (key === undefined) {
                break;
            }
            if (key.endsWith("/message") || key.split("/").length != 3 || key == "last") {
                continue;
            }
            const [pubSig, txVin] = key.split("/");
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
                    console.log(`The result WIF is: ${pair.toWIF()}`);
                    wifs.push(pair.toWIF());
                    await db.put(`${pubSig}/wif`, pair.toWIF());
                    delete found[pubSig];
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