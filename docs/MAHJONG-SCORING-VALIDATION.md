# Hong Kong Mahjong scoring validation — 23 October 2026

## Result and scope

Validated source: **2.0.1 / 2026-10-23-mahjong-csp-controls-1**, base commit `70236ca9bfa67e40e44b74662036f971752b2c22`. The user explicitly requested validation. No production code, room data, rules, score/payment implementation, protocol, package version or hosting was changed during validation. New/updated tests and this report are local and require separate Git publication authorization.

**106 tests passed, zero failed** through `npm run test:ui`: 95 Hong Kong scoring/server tests, two native Mahjong session tests and nine shared UI component tests. Tests use local fixtures and ephemeral loopback sockets only; no production rooms or player data. This validates the cases below, not every possible hand or a complete tournament system.

## Primary reference

[HKMA rules index](https://www.hkmahjong.org/rules?lang=en) links to the [English Hong Kong Mahjong rulebook](https://docs.google.com/document/d/1a66AhGRZE6IJmA_nd-C7gIQfSJ7sXo_2-c4XgVnMpTQ/edit). Retrieved 23 October 2026. Relevant sections: Score Calculation, Basic Principles, Payment and Receipt, List of Faan Items, Faan to Score Table, and Robbing a kan. The reference is the association's English document, not a claim of one universal rule set across all Hong Kong home games.

Expected fixture scores and payer amounts were taken from those sections; no rulebook text/images are bundled. Local operator records retain source retrieval hash and logs privately.

## Coverage

| Area | Verification |
| --- | --- |
| Qualification and compound fan | No automatic winning fan; minimum 3, maximum 10; all sequences, closed hand, self draw; additive compatible bonuses |
| Meld/wind/dragon scoring | Concealed Kong excludes Closed Hand; seat/round wind separately and combined; dragon triplets; Small/Big Dragons include individual dragon fan |
| Major patterns | All Triplets, mixed suit with honours, pure flush, terminals/honours, all honours, small/big winds, concealed triplets, four Kong, terminals, Heaven/Earth, Thirteen Orphans, consecutive Kong, Nine Gates discard/self-draw distinction |
| Ambiguous hands | Fixture where triplet decomposition beats sequence interpretation; highest scoring interpretation selected |
| Invalid/unsupported shapes | Under/over-sized hands, concealed five-copy input, flower used as hand tile; isolated Seven Pairs is not the HK winning profile |
| Payment table | Every fan 3–10: discard, normal self-draw and Pao, all winner/payer seat combinations; exact debit/credit, zero sum, no payment below minimum |
| Native server settlement | Fan qualification, balances, Rp conversion, one settlement/ledger entry even if endHand is repeated; current discarder remains liable despite another Pao player |
| Pao establishment | Fourth meld counts an earlier concealed Kong; third dragon creates liability; later fourth meld replaces prior Pao; fourth concealed Kong does not create a new Pao |
| Circumstances | Seat and prevailing wind after dealer rotations; Heaven/Earth conditions; ordinary draw resets Kong-chain state |
| Flowers | Replacement chain draws from wall tail, flowers do not stay in hand; standard HKMA adds no flower fan; initial deal conserves 144 tiles and 13/14 hand counts |
| House options | Optional flower bonus checked separately; jokers OFF rejected, 1–4 jokers ON can complete ordinary concealed shapes, no manufactured limit patterns in checked fixtures; inventory 136/144/148 |
| Shape sampling | 1,000 seeded natural standard hands agree on acceptance with separate existing engine decomposition; additive/capped fan arithmetic checked. This is not an independent numeric scoring oracle for all 1,000 hands |

### Payment examples

| Fan | Discarder pays | Normal self-draw: each opponent pays | Winner receives on normal self-draw |
| --- | ---: | ---: | ---: |
| 3 | 32 | 16 | 48 |
| 4 | 64 | 32 | 96 |
| 5 | 96 | 48 | 144 |
| 6 | 128 | 64 | 192 |
| 7 | 192 | 96 | 288 |
| 8 | 256 | 128 | 384 |
| 9 | 384 | 192 | 576 |
| 10 | 512 | 256 | 768 |

Pao on self-draw makes the responsible player pay the entire self-draw total, not merely the ordinary discard amount. If winning on a discard, the actual discarder pays the discard amount. Rp is the resulting net points multiplied by the configured rate; it is not an integrated payment.

## Test maintenance found during the run

- Existing native session fixtures still sent protocol v9; updated to current v10. The start fixture now explicitly skips opening animation so the assertion sees the dealt hand rather than the intentionally concealed opening view.
- Existing UI test mock lacked browser-global addEventListener required by current social overlays; supplied the missing mock. No production component changed to make these tests pass.
- Two new initial expectations were corrected against the compound-fan rule: a flush made entirely of sequences also earns All Sequences; a non-nine-sided discard Nine Gates shape in the fixture earns Flush + Closed Hand, without the limit. Final fixtures reflect the reference, rather than changing the scorer to match mistaken expectations.
- No scoring/settlement defect was found in the checked cases. This is not a guarantee that no defects exist.

## Reproduce

Use Node 22+ and locked installed dependencies in an isolated development checkout:

```sh
node --test tests/mahjong-hong-kong.test.js
npm run test:ui
```

Only run tests when the current user authorizes validation, per AGENTS.md. Session tests bind ephemeral loopback ports, close their own resources and use no persistent production DATA_DIR. They create disposable fixture rooms, not live cloud rooms.

## Remaining limits

- No full live cloud match, persistence/eviction/reconnect race, duplicate network claim race or fault-injected storage/payment test was performed here. Native deterministic server fixtures are not production-cloud durability proof.
- All natural hands, joker representations and extreme joker performance have not been exhaustively enumerated. Sampling cross-checks shape acceptance, not every numeric fan against a second independently authored scoring engine.
- Physical referee penalties, exposure/foul rules and tournament administration are not implemented. Helpers, undo and Quick Play remain casual-table features.
- Optional jokers and flower fan bonuses are labelled house rules, not HKMA scoring. Legacy rooms still keep their original scoring; these results describe the HKMA profile.
- The other games' inline-handler/CSP compatibility remains a separate UI task. Passing this suite does not validate browser interaction across all games.
