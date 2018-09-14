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

    it("test case #2", async function () {
        // invalid signature
        try {
            await guessor({
                message1Buffer: Buffer.from("f522bb5b4eee9896c2b903bfe8dac5ac3ab2df19912c40df7e0db7d1b186306d", "hex"),
                message2Buffer: Buffer.from("91403b9c58156e4177b6c7bd5f3f404e4b0b4011c2528afd42fc46f91e5f0c2f", "hex"),

                signature1Buffer: Buffer.from("3042021f30c123ead7238b1aa6f74540486c02e6036d8815d3b0aab99e4130cd793a2a021f5b421fc1d887b0fd284174fa1b44eaf47a275cccba1a777ffed3c4fff71bc2", "hex"),
                signature2Buffer: Buffer.from("3042021f30c123ead7238b1aa6f74540486c02e6036d8815d3b0aab99e4130cd793a2a021f74cc4c0de9b81ffefafbd7de739e5b9ff86ef9d4ce698a2679ca9178883ffd", "hex")
            });
            throw new Error("Error should happen and unreachable");
        } catch (e) {
            // expected
            assert.strictEqual(e.message, "cannot verify message2 from pubic key recovered from message1, refusing computation");
            return e;
        }
    });

    it("test case #3", async function () {
        // created using create-bad-signature.js
        const result = await guessor({
            message1Buffer: Buffer.from("8dfa42db4fd73eb62994a79fc13526810402d35a2dcc4578984b07d10fa70004", "hex"),
            message2Buffer: Buffer.from("35ef1b70021d878aa746599c9334d25074c73ab7bd1e711f7e2201c1e136fc4f", "hex"),

            signature1Buffer: Buffer.from("3044022030c123ead7238b1aa6f74540486c02e6036d8815d3b0aab99e4130cd793a2a4c0220205fab1b2f5c54f7542f9a0ea03ad8fa9d1fa922c6b2fa2f6b458732cd515087", "hex"),
            signature2Buffer: Buffer.from("3044022030c123ead7238b1aa6f74540486c02e6036d8815d3b0aab99e4130cd793a2a4c0220719a428ca808ea42121dcab5999333a3f3c563e14273a8c8ab4e0c4c1800aa52", "hex")
        });
        const expected = Buffer.from("cc4d7363c5e50e6bcef1473625617e31ce605d7ec4e734a83b3739db51daf150", "hex");

        assert.deepEqual(result, expected, "private key not matched");
        return expected;
    });
});