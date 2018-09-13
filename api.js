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

module.exports = create;