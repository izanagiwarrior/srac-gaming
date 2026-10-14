'use strict';

// Capsa uses a running balance: one remaining card costs one point.
// No pot, buy-in, payment processing, or loss multiplier is needed.
function recap(players, history, settings, phase, practice) {
  const rate = settings.pointValue;
  const rows = players.map((p,seat) => ({ seat, name:p.name, bot:p.bot, points:p.score, net:p.score * rate }));
  const total = rows.reduce((sum,p) => sum + p.net,0);
  if (total !== 0 || rows.some(p => !Number.isSafeInteger(p.net))) throw new Error('Rekap rupiah tidak seimbang.');
  const debtors = rows.filter(p => p.net < 0).map(p => ({ ...p, remaining:-p.net })).sort((a,b) => b.remaining - a.remaining);
  const creditors = rows.filter(p => p.net > 0).map(p => ({ ...p, remaining:p.net })).sort((a,b) => b.remaining - a.remaining);
  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].remaining,creditors[j].remaining);
    transfers.push({ from:debtors[i].seat, fromName:debtors[i].name, to:creditors[j].seat, toName:creditors[j].name, amount });
    debtors[i].remaining -= amount; creditors[j].remaining -= amount;
    if (!debtors[i].remaining) i++;
    if (!creditors[j].remaining) j++;
  }
  return { rate, practice:rate === 0, simulation:!!practice, rows, transfers, total, rounds:history.length, final:phase === 'finished',
    totalReceive:rows.reduce((sum,p) => sum + Math.max(0,p.net),0),
    totalPay:rows.reduce((sum,p) => sum + Math.max(0,-p.net),0) };
}

module.exports = { recap };
