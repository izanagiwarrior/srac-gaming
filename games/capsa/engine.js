(function (root) {
  'use strict';
  const SUITS = ['♦', '♣', '♥', '♠'];
  const LABELS = ['Single', 'Pair', 'Triple', 'Straight', 'Flush', 'Full house', 'Four of a kind + 1', 'Straight flush'];
  const BOT_LEVELS = ['easy', 'normal', 'hard'];
  const DEFAULTS = { straightRule: 'indonesia', lockPass: true, botLevel: 'normal', mode:'official', pointValue:0, easyMode:false };
  const rankName = r => ({ 11:'J', 12:'Q', 13:'K', 14:'A' }[r] || String(r));
  const rankValue = r => r === 2 ? 15 : r;
  const card = id => ({ id, rank: 2 + id % 13, suit: Math.floor(id / 13) });
  const cardValue = c => rankValue(c.rank) * 4 + c.suit;
  const sortCards = cards => cards.slice().sort((a, b) => cardValue(a) - cardValue(b));
  const cardName = c => rankName(c.rank) + SUITS[c.suit];
  function compareKey(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0) !== (b[i] || 0)) return Math.sign((a[i] || 0) - (b[i] || 0));
    }
    return 0;
  }
  function evaluate(cards, settings = DEFAULTS) {
    if (!Array.isArray(cards) || ![1, 2, 3, 5].includes(cards.length)) return { ok:false, reason:'Pilih 1 kartu, pair (2), triple (3), atau kombinasi 5 kartu.' };
    if (cards.some(c => !c || !Number.isInteger(c.id) || c.id < 0 || c.id > 51) || new Set(cards.map(c => c.id)).size !== cards.length) return { ok:false, reason:'Kartu tidak valid atau duplikat.' };
    const sorted = sortCards(cards), high = sorted.at(-1);
    const counts = new Map();
    for (const c of cards) counts.set(c.rank, (counts.get(c.rank) || 0) + 1);
    const groups = [...counts].sort((a, b) => b[1] - a[1] || rankValue(b[0]) - rankValue(a[0]));
    let category, key, detail;
    if (cards.length === 1) { category = 0; key = [rankValue(high.rank), high.suit]; detail = cardName(high); }
    else if (cards.length < 5) {
      if (counts.size !== 1) return { ok:false, reason:cards.length === 2 ? 'Pair harus dua kartu berangka sama.' : 'Triple harus tiga kartu berangka sama.' };
      category = cards.length === 2 ? 1 : 2; key = [rankValue(high.rank), high.suit]; detail = rankName(high.rank) + ' · ' + SUITS[high.suit];
    } else {
      const ranks = [...counts.keys()].sort((a, b) => a - b);
      const flush = cards.every(c => c.suit === cards[0].suit);
      let straight = null;
      if (counts.size === 5) {
        if (settings.straightRule === 'linear') {
          const values = ranks.map(rankValue).sort((a, b) => a - b);
          if (values[4] - values[0] === 4) straight = { rank:values[4], suit:high.suit, top:high };
        } else {
          const signature = ranks.join(',');
          if (signature === '2,3,4,5,14' || signature === '2,3,4,5,6' || signature === '2,11,12,13,14') {
            const two = cards.find(c => c.rank === 2); straight = { rank:15, suit:two.suit, top:two };
          } else if (!counts.has(2) && ranks[4] - ranks[0] === 4) {
            const top = cards.find(c => c.rank === ranks[4]); straight = { rank:ranks[4], suit:top.suit, top };
          }
        }
      }
      if (straight && flush) { category = 7; key = [straight.rank, straight.suit]; detail = 'puncak ' + cardName(straight.top); }
      else if (groups[0][1] === 4) { category = 6; key = [rankValue(groups[0][0])]; detail = 'empat ' + rankName(groups[0][0]); }
      else if (groups[0][1] === 3 && groups[1][1] === 2) { category = 5; key = [rankValue(groups[0][0])]; detail = 'triple ' + rankName(groups[0][0]); }
      else if (flush) { category = 4; key = [rankValue(high.rank), high.suit]; detail = 'puncak ' + cardName(high); }
      else if (straight) { category = 3; key = [straight.rank, straight.suit]; detail = 'puncak ' + cardName(straight.top); }
      else return { ok:false, reason:'Lima kartu harus straight, flush, full house, four of a kind + 1, atau straight flush.' };
    }
    return { ok:true, size:cards.length, category, key:[category, ...key], label:LABELS[category], detail };
  }
  function beats(a, b) { return a.ok && b.ok && a.size === b.size && compareKey(a.key, b.key) > 0; }
  function validatePlay(hand, ids, context = {}) {
    if (!Array.isArray(ids) || ![1, 2, 3, 5].includes(ids.length)) return { ok:false, reason:'Mainkan 1, 2, 3, atau 5 kartu.' };
    const lookup = new Map(hand.map(c => [c.id, c]));
    if (new Set(ids).size !== ids.length || ids.some(id => !Number.isInteger(id) || !lookup.has(id))) return { ok:false, reason:'Ada kartu duplikat atau kartu yang bukan milikmu.' };
    if (context.requiredCard !== null && context.requiredCard !== undefined && !ids.includes(context.requiredCard)) return { ok:false, reason:'Pembukaan setiap ronde harus menyertakan 3♦.' };
    const cards = sortCards(ids.map(id => lookup.get(id))), evaluation = evaluate(cards, context.settings || DEFAULTS);
    if (!evaluation.ok) return evaluation;
    if (context.table) {
      if (cards.length !== context.table.cards.length) return { ok:false, reason:'Meja berisi ' + context.table.cards.length + ' kartu. Lawan dengan jumlah kartu yang sama.' };
      if (!beats(evaluation, context.table.evaluation)) return { ok:false, reason:'Kombinasimu harus lebih tinggi dari ' + context.table.evaluation.label + ' di meja.' };
    }
    return { ok:true, cards, evaluation };
  }
  function combinations(items, size) {
    const result = [];
    function visit(start, selected) {
      if (selected.length === size) { result.push(selected.slice()); return; }
      for (let i = start; i <= items.length - (size - selected.length); i++) { selected.push(items[i]); visit(i + 1, selected); selected.pop(); }
    }
    visit(0, []); return result;
  }
  function legalMoves(hand, context = {}) {
    const sizes = context.table ? [context.table.cards.length] : [1, 2, 3, 5];
    const result = [];
    for (const size of sizes) if (hand.length >= size) for (const cards of combinations(hand, size)) {
      const checked = validatePlay(hand, cards.map(c => c.id), context);
      if (checked.ok) result.push({ cards:checked.cards, ids:checked.cards.map(c => c.id), evaluation:checked.evaluation });
    }
    return result.sort((a, b) => b.ids.length - a.ids.length || compareKey(a.evaluation.key, b.evaluation.key));
  }
  function chooseMove(hand, context = {}) {
    const moves = legalMoves(hand, context);
    if (!moves.length) return null;
    const finish = moves.find(m => m.ids.length === hand.length); if (finish) return finish;
    const requested = context.botLevel || context.settings?.botLevel || DEFAULTS.botLevel;
    const level = BOT_LEVELS.includes(requested) ? requested : DEFAULTS.botLevel;
    const random = typeof context.random === 'function' ? context.random : Math.random;
    const roll = () => Math.max(0, Math.min(0.999999, Number(random()) || 0));
    const pick = choices => choices[Math.floor(roll() * choices.length)];
    if (level === 'hard') {
      if (context.nextCount === 1) {
        const multiple = moves.filter(m => m.ids.length > 1);
        if (!multiple.length) return moves.reduce((a, b) => compareKey(a.evaluation.key, b.evaluation.key) > 0 ? a : b);
        return multiple[0];
      }
      return moves[0];
    }
    if (level === 'easy') {
      if (context.table && roll() < 0.32) return null;
      if (!context.table && roll() < 0.72) {
        const singles = moves.filter(m => m.ids.length === 1);
        if (singles.length) return pick(singles);
      }
      return pick(moves);
    }
    if (context.table) {
      if (hand.length > 4 && roll() < 0.10) return null;
      if (roll() < 0.22) return pick(moves.slice(0, 3));
    } else if (roll() < 0.30) {
      const small = moves.filter(m => m.ids.length <= 2);
      if (small.length) return pick(small.slice(0, 4));
    }
    return moves[0];
  }
  function createGame(hands, settings = {}, opener = null, requireThree = true) {
    if (hands.length < 3 || hands.length > 8 || hands.some(hand => !Array.isArray(hand) || !hand.length) || new Set(hands.flat().map(c => c.id)).size !== hands.flat().length) throw new Error('Diperlukan 3–8 tangan dengan kartu unik.');
    const first = hands.findIndex(hand => hand.some(c => c.id === 1));
    if (requireThree && first < 0) throw new Error('3♦ tidak ditemukan.');
    const turn = requireThree ? first : (opener ?? (first >= 0 ? first : 0));
    if (!Number.isInteger(turn) || turn < 0 || turn >= hands.length) throw new Error('Kursi pembuka tidak valid.');
    return { hands:hands.map(sortCards), initialCounts:hands.map(hand => hand.length), settings:{ ...DEFAULTS, ...settings }, turn, requiredCard:requireThree ? 1 : null, table:null, lastTable:null, passed:[], status:'playing', winner:null, actionNo:0, events:[], played:[], lastAction:null };
  }
  function nextSeat(game, current) {
    for (let n = 1; n <= game.hands.length; n++) {
      const seat = (current + n) % game.hands.length;
      if (!game.settings.lockPass || !game.passed.includes(seat)) return seat;
    }
    return current;
  }
  function step(game, seat, action) {
    if (game.status !== 'playing') return { ok:false, reason:'Ronde ini sudah selesai.' };
    if (seat !== game.turn) return { ok:false, reason:'Belum giliranmu.' };
    if (action.type === 'pass') {
      if (!game.table) return { ok:false, reason:'Kamu membuka meja. Mainkan kartu; tidak bisa lewat.' };
      if (!game.passed.includes(seat)) game.passed.push(seat);
      const leader = game.table.seat;
      const reset = game.hands.every((hand,i) => i === leader || game.passed.includes(i));
      game.actionNo++;
      game.lastAction = { type:'pass', seat, reset, leader, seq:game.actionNo };
      game.events.push(game.lastAction);
      if (reset) { game.lastTable = game.table; game.table = null; game.turn = leader; game.passed = []; }
      else game.turn = nextSeat(game, seat);
    } else if (action.type === 'play') {
      const valid = validatePlay(game.hands[seat], action.ids, { table:game.table, requiredCard:game.requiredCard, settings:game.settings });
      if (!valid.ok) return valid;
      const ids = new Set(action.ids);
      game.hands[seat] = game.hands[seat].filter(c => !ids.has(c.id));
      game.requiredCard = null; game.lastTable = null;
      if (!game.settings.lockPass) game.passed = [];
      game.actionNo++;
      game.table = { seat, cards:valid.cards, evaluation:valid.evaluation, seq:game.actionNo };
      game.lastAction = { type:'play', seat, cards:valid.cards, evaluation:valid.evaluation, seq:game.actionNo };
      game.events.push(game.lastAction); game.played.push(...valid.cards);
      if (game.hands[seat].length === 0) { game.winner = seat; game.status = 'over'; }
      else game.turn = nextSeat(game, seat);
    } else return { ok:false, reason:'Aksi tidak valid.' };
    if (game.events.length > 80) game.events.shift();
    return { ok:true, action:game.lastAction };
  }
  function score(game) {
    if (game.status !== 'over') throw new Error('Ronde belum selesai.');
    const delta = game.hands.map((hand, i) => i === game.winner ? 0 : -hand.length);
    delta[game.winner] = -delta.reduce((sum, n) => sum + n, 0);
    return { winner:game.winner, delta, remaining:game.hands.map(hand => hand.slice()), lastPlay:game.table };
  }
  const api = { SUITS, LABELS, DEFAULTS, BOT_LEVELS, rankName, rankValue, card, cardName, cardValue, sortCards, evaluate, beats, compareKey, validatePlay, legalMoves, chooseMove, createGame, step, score };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CapsaBanting = { SUITS, LABELS, DEFAULTS, rankName, rankValue, card, cardName, cardValue, sortCards, evaluate, beats, validatePlay };
})(typeof globalThis !== 'undefined' ? globalThis : this);
