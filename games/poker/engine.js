/* Texas Hold'em rules. Pure state, shared hand evaluator, no browser authority. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Poker = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SUITS = ['s', 'h', 'd', 'c'];
  const HANDS = ['High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];
  function deck() { return SUITS.flatMap(s => Array.from({length: 13}, (_, i) => ({r: i + 2, s}))); }
  function shuffle(cards, randomInt) {
    if (!randomInt) throw new Error('Shuffle requires a secure random integer source.');
    for (let i = cards.length - 1; i > 0; i--) { const j = randomInt(i + 1); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }
  function compare(a, b) { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return Math.sign(d); } return 0; }
  function five(cards) {
    const ranks = cards.map(c => c.r).sort((a, b) => b - a);
    const counts = new Map(); for (const r of ranks) counts.set(r, (counts.get(r) || 0) + 1);
    const groups = [...counts].sort((a,b) => b[1] - a[1] || b[0] - a[0]);
    const flush = cards.every(c => c.s === cards[0].s);
    let straight = 0;
    if (counts.size === 5) {
      if (ranks[0] - ranks[4] === 4) straight = ranks[0];
      else if (ranks.join(',') === '14,5,4,3,2') straight = 5;
    }
    let score;
    if (flush && straight) score = [8, straight];
    else if (groups[0][1] === 4) score = [7, groups[0][0], groups[1][0]];
    else if (groups[0][1] === 3 && groups[1][1] === 2) score = [6, groups[0][0], groups[1][0]];
    else if (flush) score = [5, ...ranks];
    else if (straight) score = [4, straight];
    else if (groups[0][1] === 3) score = [3, groups[0][0], ...groups.slice(1).map(g => g[0])];
    else if (groups[0][1] === 2 && groups[1][1] === 2) score = [2, Math.max(groups[0][0], groups[1][0]), Math.min(groups[0][0], groups[1][0]), groups[2][0]];
    else if (groups[0][1] === 2) score = [1, groups[0][0], ...groups.slice(1).map(g => g[0])];
    else score = [0, ...ranks];
    return {score, name: score[0] === 8 && straight === 14 ? 'Royal flush' : HANDS[score[0]], cards};
  }
  function evaluate(cards) {
    if (cards.length < 5 || cards.length > 7) throw new Error('Evaluate needs 5–7 cards.');
    let best = null;
    for (let a = 0; a < cards.length - 4; a++) for (let b = a + 1; b < cards.length - 3; b++)
    for (let c = b + 1; c < cards.length - 2; c++) for (let d = c + 1; d < cards.length - 1; d++)
    for (let e = d + 1; e < cards.length; e++) {
      const hand = five([cards[a], cards[b], cards[c], cards[d], cards[e]]);
      if (!best || compare(hand.score, best.score) > 0) best = hand;
    }
    return best;
  }
  class Game {
    constructor(players, settings, randomInt) {
      this.players = players; this.settings = settings; this.randomInt = randomInt;
      this.dealer = -1; this.handNo = 0; this.over = true; this.turn = -1;
      this.phase = 'waiting'; this.board = []; this.pots = []; this.result = null; this.log = [];
      this.pending = new Set(); this.version = 0;
    }
    next(from, predicate) { for (let n = 1; n <= this.players.length; n++) { const i = (from + n + this.players.length) % this.players.length; if (predicate(this.players[i], i)) return i; } return -1; }
    live() { return this.players.filter(p => p.inHand && !p.folded); }
    canAct(p) { return p.inHand && !p.folded && p.stack > 0; }
    note(text) { this.log.push({text, phase: this.phase}); this.log = this.log.slice(-120); }
    pot() { return this.players.reduce((sum, p) => sum + (p.contributed || 0), 0); }
    pay(index, amount) { const p = this.players[index]; amount = Math.min(p.stack, amount); p.stack -= amount; p.bet += amount; p.contributed += amount; return amount; }
    start() {
      if (!this.over) throw new Error('Finish the current hand first.');
      const ready = p => p.stack > 0 && !p.sittingOut && (p.connected || p.bot);
      if (this.players.filter(ready).length < 2) throw new Error('At least 2 active players with chips are needed.');
      this.dealer = this.next(this.dealer, ready); this.handNo++; this.version++;
      this.deck = shuffle(deck(), this.randomInt); this.board = []; this.burned = [];
      this.phase = 'preflop'; this.over = false; this.result = null; this.pots = []; this.log = [];
      for (const p of this.players) {
        p.inHand = ready(p); p.hole = []; p.folded = false; p.bet = 0; p.contributed = 0;
        p.actedAt = null; p.lastAction = ''; p.startStack = p.stack;
      }
      // Deal clockwise, one card at a time; a burn precedes each board street.
      for (let n = 0; n < 2; n++) {
        let i = this.dealer; for (let dealt = 0; dealt < this.live().length; dealt++) { i = this.next(i, p => p.inHand); this.players[i].hole.push(this.deck.pop()); }
      }
      this.smallBlind = this.live().length === 2 ? this.dealer : this.next(this.dealer, p => p.inHand);
      this.bigBlind = this.next(this.smallBlind, p => p.inHand);
      this.pay(this.smallBlind, this.settings.smallBlind); this.pay(this.bigBlind, this.settings.bigBlind);
      this.players[this.smallBlind].lastAction = 'Small blind'; this.players[this.bigBlind].lastAction = 'Big blind';
      this.currentBet = this.settings.bigBlind; this.minRaise = this.settings.bigBlind;
      this.pending = new Set(this.players.map((p,i) => this.canAct(p) ? i : -1).filter(i => i >= 0));
      this.note(`Hand #${this.handNo} · ${this.players[this.dealer].name} is the dealer.`);
      this.progress(this.bigBlind);
    }
    options(index) {
      if (this.over || this.turn !== index || !this.pending.has(index)) return null;
      const p = this.players[index]; const owed = Math.max(0, this.currentBet - p.bet);
      const canRaise = p.bet + p.stack > this.currentBet && this.players.some((q,i) => i !== index && this.canAct(q)) && (p.actedAt === null || this.currentBet - p.actedAt >= this.minRaise);
      return {check: owed === 0, call: Math.min(owed, p.stack), owed, canRaise,
        minTo: this.currentBet + this.minRaise, maxTo: p.bet + p.stack,
        allIn: p.stack <= owed || canRaise, bet: p.bet};
    }
    act(index, action, amount) {
      const o = this.options(index); if (!o) throw new Error('It is not your turn.');
      const p = this.players[index]; let text;
      if (action === 'fold') { p.folded = true; text = 'Fold'; }
      else if (action === 'check') { if (!o.check) throw new Error('There is a bet to match. Call or fold.'); text = 'Check'; }
      else if (action === 'call') {
        if (o.check) throw new Error('There is no bet to call.');
        const paid = this.pay(index, o.call); text = `Call ${paid}${p.stack === 0 ? ' · all-in' : ''}`;
      } else if (action === 'raise' || action === 'allin') {
        const target = action === 'allin' ? o.maxTo : amount;
        if (!Number.isSafeInteger(target) || target <= p.bet || target > o.maxTo) throw new Error('Invalid chip amount.');
        if (target <= this.currentBet && action === 'allin') {
          if (!o.allIn) throw new Error('All-in is not available.');
          this.pay(index, p.stack); text = `All-in ${target}`;
        } else {
          if (!o.canRaise) throw new Error('Raising is not reopened, or no opponent can respond.');
          if (target < o.minTo && target !== o.maxTo) throw new Error(`Minimum raise to ${o.minTo} chips (or all-in).`);
          const increment = target - this.currentBet;
          this.pay(index, target - p.bet);
          if (increment >= this.minRaise) this.minRaise = increment;
          this.currentBet = target;
          for (let i = 0; i < this.players.length; i++) if (i !== index && this.canAct(this.players[i]) && this.players[i].bet < target) this.pending.add(i);
          text = `${p.stack === 0 ? 'All-in' : 'Bet / raise'} ${target}`;
        }
      } else throw new Error('Unknown action.');
      p.actedAt = this.currentBet; p.lastAction = text; this.pending.delete(index); this.version++;
      this.note(`${p.name}: ${text}.`); this.progress(index);
    }
    progress(after) {
      if (this.live().length === 1) return this.finish(false);
      for (const i of this.pending) if (!this.canAct(this.players[i])) this.pending.delete(i);
      const actors = this.players.map((p,i) => this.canAct(p) ? i : -1).filter(i => i >= 0);
      // With no opponent able to bet, only actual wagers need matching. A short
      // all-in big blind must not force a lone opponent to call the nominal blind.
      if (actors.length === 1) {
        this.currentBet = Math.max(...this.live().map(p => p.bet));
        if (this.players[actors[0]].bet >= this.currentBet) this.pending.clear();
      }
      if (this.pending.size) { this.turn = this.next(after, (_, i) => this.pending.has(i)); return; }
      this.advance();
    }
    dealStreet() {
      this.burned.push(this.deck.pop());
      if (this.board.length === 0) { this.board.push(this.deck.pop(), this.deck.pop(), this.deck.pop()); this.phase = 'flop'; }
      else { this.board.push(this.deck.pop()); this.phase = this.board.length === 4 ? 'turn' : 'river'; }
      this.note(`${this.phase[0].toUpperCase() + this.phase.slice(1)} dealt.`);
    }
    advance() {
      if (this.board.length === 5) return this.finish(true);
      if (this.players.filter(p => this.canAct(p)).length <= 1) { while (this.board.length < 5) this.dealStreet(); return this.finish(true); }
      this.dealStreet(); this.currentBet = 0; this.minRaise = this.settings.bigBlind;
      for (const p of this.players) { p.bet = 0; p.actedAt = null; if (this.canAct(p)) p.lastAction = ''; }
      this.pending = new Set(this.players.map((p,i) => this.canAct(p) ? i : -1).filter(i => i >= 0));
      this.turn = this.next(this.dealer, (_,i) => this.pending.has(i));
    }
    finish(showdown) {
      const totalPot = this.pot(); const awards = this.players.map(() => 0); const refunds = this.players.map(() => 0);
      const ranks = this.players.map(p => showdown && p.inHand && !p.folded ? evaluate([...p.hole, ...this.board]) : null);
      const levels = [...new Set(this.players.map(p => p.contributed).filter(n => n > 0))].sort((a,b) => a-b);
      let previous = 0; const pots = [];
      for (const level of levels) {
        const contributors = this.players.map((p,i) => p.contributed >= level ? i : -1).filter(i => i >= 0);
        const amount = (level - previous) * contributors.length; previous = level;
        if (contributors.length === 1) { refunds[contributors[0]] += amount; continue; }
        let eligible = contributors.filter(i => this.players[i].inHand && !this.players[i].folded);
        if (!eligible.length) throw new Error('Pot has no eligible player.');
        let winners;
        if (!showdown) winners = eligible;
        else {
          let best = eligible[0]; for (const i of eligible) if (compare(ranks[i].score, ranks[best].score) > 0) best = i;
          winners = eligible.filter(i => compare(ranks[i].score, ranks[best].score) === 0);
        }
        // Odd chips go clockwise from the button, per pot.
        winners.sort((a,b) => ((a - this.dealer - 1 + this.players.length) % this.players.length) - ((b - this.dealer - 1 + this.players.length) % this.players.length));
        const share = Math.floor(amount / winners.length); let extra = amount % winners.length;
        for (const i of winners) awards[i] += share + (extra-- > 0 ? 1 : 0);
        pots.push({amount, eligible, winners});
      }
      for (let i = 0; i < this.players.length; i++) this.players[i].stack += awards[i] + refunds[i];
      this.result = {showdown, totalPot, contestedPot: totalPot - refunds.reduce((a,b) => a+b,0), pots, awards, refunds,
        ranks, delta: this.players.map(p => p.stack - p.startStack)};
      this.over = true; this.phase = showdown ? 'showdown' : 'finished'; this.turn = -1; this.pending.clear(); this.pots = pots;
      const names = this.players.filter((p,i) => awards[i] > 0).map(p => p.name).join(', ');
      this.note(`${names} wins the pot${showdown ? ' at showdown' : ' — everyone else folded'}.`);
      for (const p of this.players) { p.bet = 0; p.contributed = 0; }
    }
    serialize() { const {randomInt, players, settings, ...state} = this; return {...state, pending: [...this.pending]}; }
    static restore(players, settings, state, randomInt) { const game = new Game(players, settings, randomInt); Object.assign(game, state); game.pending = new Set(state.pending || []); return game; }
  }
  return {deck, shuffle, evaluate, compare, HANDS, Game};
});
