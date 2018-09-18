const axios = require("axios");
const coins = require("./coins");
module.exports = class RPC {
    constructor(host, port, user, pass) {
        if (!host) {
            Object.assign(this, coins.getRpcParam());
        } else {
            this.host = host;
            this.port = port;
            this.user = user;
            this.pass = pass;
        }
    }
    async call(method, params) {
        const postData = {
            method: method,
            params: params,
            id: '1'
        };
        try {
            const result = (await axios.post(`http://${this.host}:${this.port}/`, postData, {
                auth: {
                    username: this.user,
                    password: this.pass
                },
                timeout: 1500
            })).data;
            if (result.error) {
                throw result.error;
            }
            return result.result;
        } catch (e) {
            throw e.response && e.response.data || e;
        }
    }
    rawBlock(hex) {
        return this.call("getblock", [hex, false]);
    }
    blockInfo(hex) {
        return this.call("getblock", [hex, true]);
    }
    root() {
        return this.call("getblockhash", ["1"]);
    }
}