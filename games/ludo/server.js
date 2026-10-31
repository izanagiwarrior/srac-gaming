'use strict';
const {createPartyServer}=require('../shared/party-server');
const engine=require('./engine');
function createLudoServer(options={}){return createPartyServer({...options,slug:'ludo',title:'Ludo',engine,maxSeats:4});}
module.exports={createLudoServer};
