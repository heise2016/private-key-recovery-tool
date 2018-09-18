Buffer.prototype.importDER = function _importDER() {
    class Position {
        constructor() {
            this.place = 0;
        }
    }

    function getLength(buf, p) {
        var initial = buf[p.place++];
        if (!(initial & 0x80)) {
            return initial;
        }
        var octetLen = initial & 0xf;
        var val = 0;
        for (var i = 0, off = p.place; i < octetLen; i++, off++) {
            val <<= 8;
            val |= buf[off];
        }
        p.place = off;
        return val;
    }


    const BN = bn;
    let data = this;
    var p = new Position();
    if (data[p.place++] !== 0x30) {
        console.log("Not DER compatible");
        return false;
    }
    var len = getLength(data, p);
    if ((len + p.place) !== data.length) {
        //console.log(`Illegal length 1 want: ${len + p.place}`);
        data = data.slice(0, len + p.place);
    }
    if (data[p.place++] !== 0x02) {
        console.log("Illegal byte coming 1");
        return false;
    }
    var rlen = getLength(data, p);
    var r = data.slice(p.place, rlen + p.place);
    p.place += rlen;
    if (data[p.place++] !== 0x02) {
        console.log("Illegal byte coming 2");
        return false;
    }
    var slen = getLength(data, p);
    if (data.length !== slen + p.place) {
        console.log("Illegal length 2");
        return false;
    }
    var s = data.slice(p.place, slen + p.place);
    if (r[0] === 0 && (r[1] & 0x80)) {
        r = r.slice(1);
    }
    if (s[0] === 0 && (s[1] & 0x80)) {
        s = s.slice(1);
    }

    return [this.r = new BN(r), this.s = new BN(s)];
};