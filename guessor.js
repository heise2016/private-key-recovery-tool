// https://bitcoin.stackexchange.com/questions/35848/recovering-private-key-when-someone-uses-the-same-k-twice-in-ecdsa-signatures
const elliptic = require('elliptic');
const ec = elliptic.ec;
const curve = elliptic.curves.secp256k1;
const secp256k1 = new ec("secp256k1");
const ecSignature = require("elliptic/lib/elliptic/ec/signature");

const bn = require("bn.js");

function invModN(num) {
    return num.invm(new bn(curve.n));
}

function modN(num) {
    return num.mod(new bn(curve.n));
}

module.exports = async function perform(options) {
    const {
        message1Buffer,
        message2Buffer,
        signature1Buffer,
        signature2Buffer
    } = options;
    const z1 = new bn(message1Buffer);
    const z2 = new bn(message2Buffer);
    const signature1 = new ecSignature(signature1Buffer);
    const signature2 = new ecSignature(signature2Buffer);

    const pubKey = secp256k1.recoverPubKey(message1Buffer, signature1Buffer, 0);

    if (!signature1.r.eq(signature2.r)) {
        throw new Error("signature1.r != signature2.r, refusing computation");
    }
    if (!secp256k1.verify(message2Buffer, signature2Buffer, pubKey)) {
        throw new Error("cannot verify message2 from pubic key recovered from message1, refusing computation");
    }

    const r = signature1.r;

    const z1MinusZ2 = z1.sub(z2);

    const kCandidates = [
        modN(z1MinusZ2.mul(invModN(signature1.s.sub(signature2.s)))),
        modN(z1MinusZ2.mul(invModN(signature1.s.add(signature2.s)))),
        modN(z1MinusZ2.mul(invModN(signature1.s.neg().sub(signature2.s)))),
        modN(z1MinusZ2.mul(invModN(signature1.s.neg().add(signature2.s))))
    ];

    let solution = null;
    for (let k of kCandidates) {
        k = k.abs();
        const x = new bn(secp256k1.g.mul(k).x.toBuffer());
        if (!x.eq(r)) {
            continue;
        }
        const probPriv = modN(modN(signature1.s.mul(k).sub(z1)).mul(invModN(r)));
        if (secp256k1.g.mul(probPriv).eq(pubKey)) {
            solution = probPriv;
        }
    }
    if (solution) {
        return solution.toBuffer();
    } else {
        throw new Error("Failed to find private key from given data");
    }
}