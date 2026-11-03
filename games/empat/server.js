'use strict';
const {createPartyServer}=require('../shared/party-server');
const engine=require('./engine');
function createEmpatServer(options={}){return createPartyServer({...options,slug:'empat',title:'Empat Berturut',engine,maxSeats:2});}
module.exports={createEmpatServer};
