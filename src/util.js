'use strict';

const Buffer = require('buffer').Buffer;
const crypto = require('crypto');

let id = null;

module.exports.genId = () => {
    if (!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-ss6666-').copy(id,0);
    }
    return id;
};
