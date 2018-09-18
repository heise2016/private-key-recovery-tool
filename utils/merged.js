module.exports = () => {
    const api = require('./api').default;
    const rpc = new(require('./rpc'))();

    return {
        async rawBlock(hex) {
            try {
                return await rpc.rawBlock(hex);
            } catch (e) {
                return await api.rawBlock(hex);
            }
        },
        async blockInfo(hex) {
            try {
                return await rpc.blockInfo(hex);
            } catch (e) {
                return await api.blockInfo(hex);
            }
        },
        async root() {
            try {
                return await rpc.root();
            } catch (e) {
                return await api.root();
            }
        }
    }
}