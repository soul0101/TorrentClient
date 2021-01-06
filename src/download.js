const net = require('net');
const tracker = require('./tracker.js');
const Buffer = require('buffer').Buffer;
const message = require('./message.js')

module.exports = torrent => {
    tracker.getPeers(torrent, peers => {
        peers.forEach(peer => download(peer, torrent));
    });
};

function download(peer, torrent) {
    const socket = net.Socket();
    socket.on('error', console.log);
    socket.connect(peer.port, peer.ip, () => {
        socket.write(message.buildHandshake(torrent));
    });
    
    onWholeMsg(socket, msg => msgHandler(msg, socket));      

}

function msgHandler(msg, socket){
    if(isHandshake(msg)) socket.write(message.buildInterested());
    
    else {
        const m = message.parse(msg);

        if (m.id === 0) chokeHandler();
        if (m.id === 1) unchokeHandler();
        if (m.id === 4) haveHandler(m.payload);
        if (m.id === 5) bitfieldHandler(m.payload);
        if (m.id === 7) pieceHandler(m.payload)      

    }
}

function isHandshake(msg){
    return (msg.length === msg.readUInt8(0) + 49 && msg.toString('utf8',1, 1 + msg.readUInt8(0)) === 'BitTorrent Protocol');
}

function onWholeMsg(socket, callback) {
    var savedBuff = Buffer.alloc(0);
    var Handshake = true;

    socket.on('data', recvdBuffer => {
        const msgLen = () => Handshake ? savedBuff.readUInt8(0) + 49 : savedBuff.readUInt32BE(0) + 4;
        savedBuff = Buffer.concat([savedBuff, recvdBuffer]);

        while(savedBuff.length >=4 && savedBuff.length >= msgLen()) {
            callback(savedBuff.slice(0,msgLen()));
            savedBuff = savedBuff.slice(msgLen());
            handshake = false;
        }

    });
    
}