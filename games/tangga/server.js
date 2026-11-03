'use strict';
const {createPartyServer}=require('../shared/party-server');
const engine=require('./engine');
function createTanggaServer(options={}){return createPartyServer({...options,slug:'tangga',title:'Ular Tangga',engine,maxSeats:4});}
module.exports={createTanggaServer};
