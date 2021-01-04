'use strict';

const tracker = require('./src/tracker');
const torrentParser = require('./src/torrent-parser')
const torrent = torrentParser.open('./torrents/photoshop.torrent');


tracker.getPeers(torrent,peers=>{
    console.log('list of peers: ',peers);
});

