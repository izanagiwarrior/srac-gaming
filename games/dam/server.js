'use strict';
const {createPartyServer}=require('../shared/party-server');
const engine=require('./engine');
function createDamServer(options={}){return createPartyServer({...options,slug:'dam',title:'Dam',engine,maxSeats:2});}
module.exports={createDamServer};
