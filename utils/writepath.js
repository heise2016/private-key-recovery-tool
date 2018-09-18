const crypto = require("crypto");
const ecSignature = require("elliptic/lib/elliptic/ec/signature");
const bn = require("bn.js");

module.exports = function writePath(pubKey, signature, txHash, vin) {
    const sigR = new ecSignature(signature).r.toBuffer();
    // hash pubKey and r of signature
    let hash = crypto.createHash('sha256');
    const pubSig = hash.update(pubKey).digest(sigR).toString("hex").substring(0, 10);
    // hash txHash and vin
    hash = crypto.createHash('sha256');
    const txVin = hash.update(Buffer.from(txHash, "hex")).digest(new bn(vin).toBuffer()).toString("hex").substring(0, 10);
    // pubSig/txVin
    const finalPath = `${pubSig}/${txVin}`;
    return finalPath;
}