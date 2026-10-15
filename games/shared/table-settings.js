'use strict';
const LEVELS = ['easy','normal','hard'];
function tableSettings(input = {}, previous = { pointValue:0,botLevel:'normal',playMode:'standard' }) {
  const next = { ...previous };
  if (input.pointValue !== undefined) {
    if (!Number.isSafeInteger(input.pointValue) || input.pointValue < 0 || input.pointValue > 1000000) throw new Error('Nilai rupiah harus bulat, 0–1.000.000.');
    next.pointValue = input.pointValue;
  }
  if (input.botLevel !== undefined) {
    if (!LEVELS.includes(input.botLevel)) throw new Error('Pilih bot Easy, Normal, atau Hard.');
    next.botLevel = input.botLevel;
  }
  if (input.playMode !== undefined) {
    if (!['standard','quick'].includes(input.playMode)) throw new Error('Pilih Santai atau Quick Play.');
    next.playMode = input.playMode;
  }
  return next;
}
function record(room,deltas,label) {
  room.players.forEach((p,i) => p.score = (p.score || 0) + deltas[i]);
  room.ledger.push({ label, time:Date.now(), rate:room.settings.pointValue, players:room.players.map((p,i) => ({name:p.name,delta:deltas[i],amount:deltas[i]*room.settings.pointValue})) });
  room.ledger = room.ledger.slice(-200);
}
module.exports = { tableSettings,record };
