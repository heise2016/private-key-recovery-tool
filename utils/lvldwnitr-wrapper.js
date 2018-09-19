module.exports = class Wrapper {
    constructor(iter) {
        this.iter = iter;
    }
    next() {
        return new Promise((resolve, reject) => {
            this.iter.next((err, k, v) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        k,
                        v
                    });
                }
            })
        });
    }
    end() {
        return new Promise((resolve, reject) => {
            this.iter.end(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
        });
    }
}