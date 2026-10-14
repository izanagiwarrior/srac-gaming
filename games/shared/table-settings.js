'use strict';
const LEVELS = ['easy','normal','hard'];
function tableSettings(input = {}, previous = { pointValue:0,botLevel:'normal' }) {
  const next = { ...previous };
  if (input.pointValue !== undefined) {
    if (!Number.isSafeInteger(input.pointValue) || input.pointValue < 0 || input.pointValue > 1000000) throw new Error('Nilai rupiah harus bulat, 0–1.000.000.');
    next.pointValue = input.pointValue;
  }
  if (input.botLevel !== undefined) {
    if (!LEVELS.includes(input.botLevel)) throw new Error('Pilih bot Easy, Normal, atau Hard.');
    next.botLevel = input.botLevel;
  }
  return next;
}
function record(room,deltas,label) {
  room.players.forEach((p,i) => p.score = (p.score || 0) + deltas[i]);
  room.ledger.push({ label, time:Date.now(), rate:room.settings.pointValue, players:room.players.map((p,i) => ({name:p.name,delta:deltas[i],amount:deltas[i]*room.settings.pointValue})) });
  room.ledger = room.ledger.slice(-200);
}
module.exports = { tableSettings,record };
