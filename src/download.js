'use strict';

const net = require('net');
const tracker = require('./tracker.js');
const Buffer = require('buffer').Buffer;
const message = require('./message.js');
const Pieces = require('./Pieces.js');
const Queue = require('./Queue.js');
const fs = require('fs');

module.exports = (torrent, path) => {     
    tracker.getPeers(torrent, peers => {
        const pieces = new Pieces(torrent);
        const file = fs.openSync(path, "w");
        peers.forEach(peer => download(peer, torrent, pieces, file));
    });
};

function download(peer, torrent, pieces, file) {
    const socket = new net.Socket();
    
    socket.on('error', console.log);
    socket.connect(peer.port, peer.ip, () => {
        socket.write(message.buildHandshake(torrent));
    });
    
    const queue = new Queue(torrent);
    onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue, torrent, file));      

}

function msgHandler(msg, socket, pieces, queue, torrent, file){
    if(isHandshake(msg)) socket.write(message.buildInterested());
    
    else {
        console.log(msg.toString('utf8'));
        const m = message.parse(msg);
        console.log(m.id);

        if (m.id === 0) chokeHandler(socket);
        if (m.id === 1) unchokeHandler(socket, pieces, queue);
        if (m.id === 4) haveHandler(socket, m.payload, pieces, queue);
        if (m.id === 5) bitfieldHandler(socket, m.payload, pieces, queue);
        if (m.id === 7) pieceHandler(socket, m.payload, pieces, queue, torrent, file);
    }
}

function isHandshake(msg){
    return (msg.length === msg.readUInt8(0) + 49 && msg.toString('utf8',1, 1 + msg.readUInt8(0)) === 'BitTorrent protocol');
}

function onWholeMsg(socket, callback) {
    let savedBuff = Buffer.alloc(0);
    let Handshake = true;

    socket.on('data', recvdBuffer => {
        const msgLen = () => Handshake ? savedBuff.readUInt8(0) + 49 : savedBuff.readInt32BE(0) + 4; //changes Uint to int
        savedBuff = Buffer.concat([savedBuff, recvdBuffer]);

        while(savedBuff.length >=4 && savedBuff.length >= msgLen()) {
            callback(savedBuff.slice(0,msgLen()));
            savedBuff = savedBuff.slice(msgLen());
            Handshake = false;
        }

    });
    
}

function chokeHandler(socket) {
    socket.end();
}

function haveHandler (socket, payload, pieces, queue) {
    {
        const pieceIndex = payload.readUInt32BE(0);
        const queueEmpty = (queue.length === 0);
        
        queue.queue(pieceIndex);
        if(queueEmpty) requestPiece(socket,pieces,queue);
    
    };
}

function bitfieldHandler (socket, payload, pieces, queue){
    const queueEmpty = (queue.length === 0);
    payload.forEach((byte, i) => {
        for(let j = 0; j < 8; j++){
            if(byte % 2) queue.queue(8*i + 7 - j); 
            byte = Math.floor(byte / 2);
        }        
    });

    if(queueEmpty) requestPiece(socket, pieces, queue);
}

function unchokeHandler(socket, pieces, queue) {
    queue.choked = false;    
    requestPiece(socket, pieces, queue);
}

function requestPiece(socket, pieces, queue){
    if(queue.choked) return null;
    while(queue.length()){
        const pieceBlock = queue.dequeue();
        if(pieces.needed(pieceBlock)){
            socket.write(message.buildRequest(pieceBlock));
            pieces.addRequested(pieceBlock);
            break;
        }
    }

}

function pieceHandler(socket, payload, pieces, queue, torrent, file){
    pieces.addReceived(payload); //wouldnt this be a relatively large object to pass??


    const offset = payload.index*torrent.info['piece length'] + payload.begin;
    fs.write(file, payload.block, 0, payload.block.length, offset, () => {});


    if(pieces.isDone()){
        socket.end();
        console.log("DONE!");
    }
    else{
        requestPiece(socket, pieces, queue);
    }

}