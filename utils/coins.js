const bitcoin = require("bitcoinjs-lib");

const coins = {
    MONA: {
        network: {
            messagePrefix: '\x19Monacoin Signed Message:\n',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 50,
            scriptHash: 55,
            wif: 178, //new wif
            bech32: "mona"
        },
        explorer: [
            "https://mona.monacoin.ml/insight-api-monacoin",
            "https://mona.insight.monaco-ex.org/insight-api-monacoin",
            "https://insight.electrum-mona.org/insight-api-monacoin",
            "https://mona.chainsight.info/api"
        ]
    },
    BTC: {
        network: bitcoin.networks.bitcoin,
        explorer: [
            "https://www.localbitcoinschain.com/api",
            "https://blockexplorer.com/api",
            "https://btc.coin.space/api",
            "https://core.monacoin.ml/insight-api",
            "https://explorer.bitcoin.com/api/btc",
            "https://btc.blockdozer.com/insight-api",
            "https://insight.bitpay.com/api",
            "https://btc-bitcore4.trezor.io/api",
            "https://btc-bitcore5.trezor.io/api",
            "https://btc1.trezor.io/api"
        ]
    }
};

module.exports = {
    getNetwork: coin => {
        coin = coin || process.env.COIN || "MONA";
        return coins[coin].network;
    },
    getExplorer: coin => {
        coin = coin || process.env.COIN || "MONA";
        return coins[coin].explorer;
    },
    getDefaultCoin: () => process.env.COIN || "MONA"
}