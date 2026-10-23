const {Buffer}=require('node:buffer');
const {encode,decode}=require('../codec.cjs');
exports.serialize=value=>Buffer.from(encode(value));
exports.deserialize=value=>decode(Buffer.from(value).toString());
