const secp256k1 = require("tiny-secp256k1");
const bitcoin = require("bitcoinjs-lib");
const randomBytes = require('randombytes');
const elliptic = require('elliptic');
const ec = elliptic.ec;
const secp256k1Elliptic = new ec("secp256k1");
const Signature = require("elliptic/lib/elliptic/ec/signature");

const pair = bitcoin.ECPair.makeRandom();
const d = pair.d.toBuffer();
const pubKey = pair.getPublicKeyBuffer();

while (true) {
    const message1 = randomBytes(32);
    const message2 = randomBytes(32);

    const rawSignature1 = secp256k1.sign2(message1, d);
    const rawSignature2 = secp256k1.sign2(message2, d);
    const signature1 = new Signature(rawSignature1);
    const signature2 = new Signature(rawSignature2);

    const pointI = secp256k1Elliptic.recoverPubKey(message1, signature1, 0);
    const pointJ = secp256k1Elliptic.recoverPubKey(message2, signature2, 0);
    if (!pointI.eq(pointJ)) {
        continue;
    }

    console.log(`Public key: ${pubKey.toString('hex')}`);
    console.log(`Private key: ${d.toString('hex')}`);
    console.log(`Message 1: ${message1.toString('hex')}`);
    console.log(`Message 2: ${message2.toString('hex')}`);
    console.log(`Signature 1: ${signature1.toDER("hex")}`);
    console.log(`Signature 2: ${signature2.toDER("hex")}`);

    console.log(secp256k1Elliptic.verify(message1, signature1, pubKey));
    console.log(secp256k1Elliptic.verify(message2, signature2, pubKey));
    break;
}