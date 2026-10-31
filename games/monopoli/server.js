'use strict';
const {createPartyServer}=require('../shared/party-server');
const engine=require('./engine');
function createMonopoliServer(options={}){return createPartyServer({...options,slug:'monopoli',title:'Monopoli',engine,maxSeats:6});}
module.exports={createMonopoliServer};
