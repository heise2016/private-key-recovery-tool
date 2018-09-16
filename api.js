const axios = require("axios");
const getExp = require("./coins").getExplorer;

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
create.MONA = create(getExp("MONA"));
create.BTC = create(getExp("BTC"));
create.default = create(getExp());

module.exports = create;