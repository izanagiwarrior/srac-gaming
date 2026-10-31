# Ten-game local candidate — 3.10.0

## Layout and release boundary

Mahjong is featured first. Remaining cards in actual DOM order: Blackjack, Capsa, Catur, Domino, Ludo, Monopoli, Poker, Reversi, UNO. Desktop:1+3+3+3; tablet:two columns; phone:one. CSS illustrations add no raster assets.

Includes [UNO/Ludo](UNO-LUDO.md). New games use `games/shared/party-server.js`, individual authoritative engines, `public/party-client.js`, `public/strategy-ui.js`, `public/party.css`. Registrations cover Node, Workers, account rewards, return routing, admin naming, room tools, directory and asset build. Shared components provide chat/emotes, cheat sheet, recap/log, theme, invites, dissolve,15-second disconnect grace and delayed bots. No new dependency, SQLite actor identity or migration.

## Monopoli Nusantara

2–6players; forty Indonesian locations, cute vehicle tokens, dice wobble, arriving-token bounce and building sparkles. Reduced motion supported. Simulation starts Rp1.500.000; passing Mulai gives Rp200.000. Buy or turn-based auction; own groups, build evenly, mortgage/redeem, sell buildings, consensual property/cash trades, jail, tax, rent, debt and bankruptcy.32houses/12hotels limit supply;4houses then hotel. Hotel sale needs four available houses. Mortgage50%, redeem55% of deed price. Railways/utility rents follow ownership and dice. Three doubles send player to jail; three failed jail rolls force bail before movement.

**House profile, not a complete official edition:** Indonesian board/rent multipliers; simplified random eight-event Kabar/Dana pool; no jail-free card; auctions are turn-based with minimum10k increments and permanent passes; bankruptcy clears buildings and transfers remaining cash/property, bank assets become available without immediate bankruptcy auction; mortgaged trades transfer as-is. Warung Kopi has no jackpot. All rules are visible behind Cara main/cheat sheet.

Standard ends with last solvent player. Quick ends after each surviving player completes eight normal turns (extra throws excluded); highest net worth wins, ties split winners. Net worth cash +full property value (half when mortgaged) +building cost. Losers−10table points each; winner(s) split the positive total deterministically. Internal cash, account coins and IDR conversion of table points are separate. Existing admin table correction adjusts recap points, not private in-round Monopoli cash.

Easy/Normal/Hard differ in purchase reserve, auction cap, trade acceptance and building decisions. Bots wait at least3seconds per action.

## Reversi / Othello

Two players, black starts. Standard8×8 with four central discs. A placement must bracket opposing discs in at least one of eight directions; all bracketed discs flip. Automatically pass if no legal move. Both unable to move ends the round; most discs wins, equal counts draw. Table points are signed disc difference, zero-sum. Quick6×6 is a house variation. Legal dots and flip animation; Easy random, Normal positional/mobility evaluation, Hard bounded depth3search (900nodes/12branches cap), minimum3second delay.

## References

- [World Othello Federation rules](https://www.worldothello.org/about/about-othello/othello-rules/official-rules/english)
- [Hasbro classic reference](https://www.hasbro.com/common/instruct/Monopoly_Vintage.pdf)

References inform mechanics; Nusantara deviations above are intentional.

## Evidence and limits

Local authoring preview3026, isolated SQLite. Landing and unstarted private lobbies inspected; no Start or gameplay action. Source syntax/build/static routes checked. No automated tests requested or run. Full match, settlements, trade/debt/auction edge cases, search performance, rewards, takeover/recovery races, mobile and assistive technology remain unverified. This is a reviewable local candidate, not a claim of production readiness. No push/cloud deploy or canonical installation performed. Prior cloud3.8.1 quota incident is unchanged/unrechecked.
