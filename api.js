const axios = require("axios");
const getExp = require("./coins").getExplorer;

const proxies = [
    a => a,
    url => `https://zaif-status.herokuapp.com/proxy/${encodeURIComponent(url)}`
];

function create(endPoints) {
    let endPointOffset = 0;
    let proxyOffset = 0;
    return async function request(path) {
        while (true) {
            try {
                const data = (await axios({
                    url: proxies[proxyOffset](`${endPoints[endPointOffset]}${path}`),
                    timeout: 1000,
                    responseType: 'json'
                })).data;
                if (typeof data !== "object" || data.error) {
                    throw data;
                }
                return data;
            } catch (e) {
                proxyOffset = (proxyOffset + 1) % proxies.length;
                if (proxyOffset == 0) {
                    endPointOffset = (endPointOffset + 1) % endPoints.length;
                }
            }
        }
    }
}
create.MONA = create(getExp("MONA"));
create.BTC = create(getExp("BTC"));
create.default = create(getExp());

module.exports = create;