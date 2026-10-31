'use strict';
const {createPartyServer}=require('../shared/party-server');
const engine=require('./engine');
function createUnoServer(options={}){return createPartyServer({...options,slug:'uno',title:'UNO',engine,maxSeats:8});}
module.exports={createUnoServer};
