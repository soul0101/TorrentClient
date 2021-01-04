'use strict'

const Buffer = require('buffer').Buffer;
const torrentParser = require('./torrent-parser');

module.exports.buildHandshake = (torrent) => {
    const buf = Buffer.alloc(68);

    buf.writeUInt8BE(19, 0);

    //Experiment with buf.write("BitTorrent protocol",1)
    Buffer.from("BitTorrent protocol").copy(buf, 1); 

    buf.writeUInt32BE(0, 20);
    buf.writeUInt32BE(0, 24);
    torrentParser.infoHash(torrent).copy(buf, 28); 
    buf.write(util.genId());
    
    return buf;
};

module.exports.buildKeepAlive = () => Buffer.alloc(4);

module.exports.buildChoke = () => {
    const buf = Buffer.alloc(5);
    buf.writeUInt32BE(1, 0);
    buf.writeUInt8BE(0, 4);

    return buf;
}

module.exports.buildUnchoke = () => {
    const buf = Buffer.alloc(5);
    buf.writeUInt32BE(1, 0);
    buf.writeUInt8BE(1, 4);

    return buf;
}

module.exports.buildInterested = () => {
    const buf = Buffer.alloc(5);
    buf.writeUInt32BE(1, 0);
    buf.writeUInt8BE(2, 4);

    return buf;
}

module.exports.buildUninterested = () => {
    const buf = Buffer.alloc(5);
    buf.writeUInt32BE(1, 0);
    buf.writeUInt8BE(3, 4);

    return buf;
}

module.exports.buildHave = (index) => {
    const buf = Buffer.alloc(9);
    buf.writeUInt32BE(5, 0);
    buf.writeUInt8BE(4, 4);
    buf.writeUInt32BE(index, 5);

    return buf;
}

module.exports.buildBitfield = (bitfield) => {
    const buf = Buffer.alloc(5 + bitfield.length);
    buf.writeUInt32BE(1+bitfield.length, 0);
    buf.writeUInt8BE(5, 4);

    //experiment with Buffer.from(bitfield).copy(buf,4) and buf.write(bitfield,5)
    bitfield.copy(buf,5); 

    return buf;
}

module.exports.buildRequest = (payload) => {
    const buf = Buffer.alloc(17);
    buf.writeUInt32BE(13, 0);
    buf.writeUInt8BE(6, 4);
    buf.writeUInt32BE(payload.index, 5);
    buf.writeUInt32BE(payload.begin, 9);
    buf.writeUInt32BE(payload.length, 13);

    return buf;
}

module.exports.buildPiece = (payload) => {
    const buf = Buffer.alloc(13 + payload.block.length);
    buf.writeUInt32BE(9 + payload.block.length, 0);
    buf.writeUInt8BE(7, 4);
    buf.writeUInt32BE(payload.index, 5);
    buf.writeUInt32BE(payload.begin, 9);
    payload.block.copy(buf,13);

    return buf;
}

module.exports.buildCancel = (payload) => {
    const buf = Buffer.alloc(17);
    buf.writeUInt32BE(13);
    buf.writeUInt8BE(8, 4);
    buf.writeUInt32BE(payload.index, 5);
    buf.writeUInt32BE(payload.begin, 9);
    buf.writeUInt32BE(payload.length, 13);

    return buf;
}

module.exports.buildPort = (listenPort) => {
    const buf = Buffer.alloc(7);
    buf.writeUInt32BE(3, 0);
    buf.writeUInt8BE(9, 4);
    buf.writeUInt16BE(listenPort, 5);

    return buf;
}

