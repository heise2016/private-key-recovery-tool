const guessor = require('./guessor');

guessor({
    message1Buffer: Buffer.from("01b125d18422cdfa7b153f5bcf5b01927cf59791d1d9810009c70cd37b14f4e6", "hex"),
    message2Buffer: Buffer.from("339ff7b1ced3a45c988b3e4e239ea745db3b2b3fda6208134691bd2e4a37d6e1", "hex"),

    signature1Buffer: Buffer.from("304402200861cce1da15fc2dd79f1164c4f7b3e6c1526e7e8d85716578689ca9a5dc349d02206cf26e2776f7c94cafcee05cc810471ddca16fa864d13d57bee1c06ce39a3188", "hex"),
    signature2Buffer: Buffer.from("304402200861cce1da15fc2dd79f1164c4f7b3e6c1526e7e8d85716578689ca9a5dc349d02204ba75bdda43b3aab84b895cfd9ef13a477182657faaf286a7b0d25f0cb9a7de2", "hex")
}).then(console.log, console.log);