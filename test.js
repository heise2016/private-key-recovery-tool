const assert = require("assert");

const guessor = require('./guessor');

describe("private key calculation", function () {
    it("test case #1", async function () {
        // See https://bitcoin.stackexchange.com/questions/35848/recovering-private-key-when-someone-uses-the-same-k-twice-in-ecdsa-signatures for this test case
        const result = await guessor({
            message1Buffer: Buffer.from("01b125d18422cdfa7b153f5bcf5b01927cf59791d1d9810009c70cd37b14f4e6", "hex"),
            message2Buffer: Buffer.from("339ff7b1ced3a45c988b3e4e239ea745db3b2b3fda6208134691bd2e4a37d6e1", "hex"),

            signature1Buffer: Buffer.from("304402200861cce1da15fc2dd79f1164c4f7b3e6c1526e7e8d85716578689ca9a5dc349d02206cf26e2776f7c94cafcee05cc810471ddca16fa864d13d57bee1c06ce39a3188", "hex"),
            signature2Buffer: Buffer.from("304402200861cce1da15fc2dd79f1164c4f7b3e6c1526e7e8d85716578689ca9a5dc349d02204ba75bdda43b3aab84b895cfd9ef13a477182657faaf286a7b0d25f0cb9a7de2", "hex")
        });
        const expected = Buffer.from("e773cf35fce567d0622203c28f67478a3361bae7e6eb4366b50e1d27eb1ed82e", "hex");

        assert.deepEqual(result, expected, "private key not matched");
        return expected;
    });
});