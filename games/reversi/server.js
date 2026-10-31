'use strict';
const {createPartyServer}=require('../shared/party-server');
const engine=require('./engine');
function createReversiServer(options={}){return createPartyServer({...options,slug:'reversi',title:'Reversi',engine,maxSeats:2});}
module.exports={createReversiServer};
