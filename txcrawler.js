const path = require("path");
const shell = require('shelljs');
const leveldown = require('leveldown');
const levelup = require('levelup');
const api = require('./utils/api');
const blockCracker = require("./utils/block-cracker");

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
            await db.batch(blockCracker(rawBlockBuffer));
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