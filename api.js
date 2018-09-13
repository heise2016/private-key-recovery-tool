const axios = require("axios");

function create(endPoints) {
    let endPointOffset = 0;
    return async function request(path) {
        while (true) {
            try {
                const data = (await axios({
                    url: `${endPoints[endPointOffset]}${path}`,
                    timeout: 1000
                })).data;
                if (typeof data !== "object") {
                    throw data;
                }
                return data;
            } catch (e) {
                endPointOffset = (endPointOffset + 1) % endPoints.length;
            }
        }
    }
}
create.MONA = create([
    "https://mona.monacoin.ml/insight-api-monacoin",
    "https://mona.insight.monaco-ex.org/insight-api-monacoin",
    "https://insight.electrum-mona.org/insight-api-monacoin",
    "https://mona.chainsight.info/api"
]);
create.BTC = create([
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
]);

module.exports = create;