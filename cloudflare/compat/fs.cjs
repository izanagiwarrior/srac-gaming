exports.existsSync=()=>false;
exports.readFile=(_path,callback)=>callback(Error('Use the public asset binding.'));
for(const name of ['mkdirSync','openSync','fchmodSync','writeFileSync','fsyncSync','closeSync','renameSync','readFileSync','statSync','createReadStream'])exports[name]=()=>{throw Error('Local file access is disabled in the cloud build.');};
