# StudyLog Shop Economy Design v1.0

> Status: Product specification — not yet implemented  
> Scope: Points, cosmetic catalog, acquisition, pricing, rewards, operations, analytics  
> Principle: Studying creates progress; spending only changes expression and atmosphere.

## 1. Product intent

The shop is not a separate shopping feature. It is the reward loop that turns study history into a visible character and room collection.

```text
Study → earn points/rewards → unlock a desired look → equip everywhere
→ create a better result card → share → return to study
```

The economy succeeds when users want to study again to obtain a specific cosmetic. It fails when watching ads, paying, or grinding menus becomes more efficient than studying.

## 2. Non-negotiable rules

1. No pay-to-win. Paid items never improve XP, focus time, ranking, streak protection, or study rewards.
2. A purchased skin is an account-wide entitlement. The user never buys the female and male versions separately.
3. Equipped appearance must be identical on Home, Timer, Capture/Share, preview, and profile surfaces.
4. Do not sell an item until every required production asset and fallback is present.
5. Purchases are idempotent. A retry must never charge twice.
6. Equip state persists across refresh and devices after authentication sync is available.
7. Users always retain a free default appearance and a usable fallback.
8. Ads are optional acceleration, never the primary source of points.

## 3. Currency model

### 3.1 Soft currency: Study Points (P)

Earned mainly through verified study behavior and used for permanent cosmetic unlocks.

Recommended initial earn sources:

| Source | Reward | Guardrail |
|---|---:|---|
| Focused study | 1P / 10 minutes | Apply only to valid completed focus time |
| Daily missions | Up to 12P/day | Mix start, duration, and completion missions |
| Optional rewarded ad | 5P, max 3/day | Maximum 15P/day; never interrupt study |
| Achievement | 5–50P | One-time, proportional to difficulty |
| Weekly challenge | 15–40P | Avoid ranking-only rewards |
| Seasonal track | Cosmetics + limited P | Prefer direct rewards over large currency drops |

Do not add a second soft currency for MVP. One understandable currency is stronger than coins, gems, tickets, and fragments.

### 3.2 Premium purchases

If cash purchases are introduced, use direct local-currency prices or clearly priced bundles. Do not use obscuring premium-gem conversion in the first version.

Cash offerings should be:

- Full-scene premium skin packs
- Curated seasonal bundles
- Membership cosmetic benefits
- Supporter packs with no power advantage

## 4. Target unlock cadence

The first purchase must arrive before the user concludes that customization is unreachable.

| Reward tier | Target time for a regular user | Purpose |
|---|---:|---|
| First small cosmetic | 1–2 days | Teach earn → buy → equip |
| Accessory / profile decoration | 2–4 days | Frequent attainable goal |
| Outfit or character variant | 5–8 days | Identity and collection |
| Standard full-scene skin | 7–14 days | Major visible milestone |
| Premium full-scene skin | 14–21 days | Long-term aspiration |
| Legendary seasonal skin | 21–35 days or season track | Prestige without power |

These targets must be validated against real median study time, not only power users.

## 5. Recommended price architecture

| Category | Price range | Notes |
|---|---:|---|
| Sticker / profile badge | 8–15P | Low-risk first purchase |
| Small accessory variant | 20–40P | Only after compatible full assets exist |
| Hair / outfit whole-avatar variant | 40–80P | One purchase includes all supported states |
| Standard room skin | 100–150P | Broad, evergreen theme |
| Premium full-scene skin | 180–260P | Room, outfits, prop/pet, all states |
| Legendary seasonal skin | 300–450P | Limited presentation, not artificial scarcity |

Existing prices can remain during migration:

- Sakura: 120P
- Moonlight Academy: 180P
- Rainy Study Cafe: 220P

Do not raise existing prices retroactively. Treat early users fairly.

## 6. Catalog packaging

### 6.1 Whole-scene skin package

Every sellable full-scene skin must include:

- Girl: idle, study, sleep, happy
- Boy: idle, study, sleep, happy
- Home/Timer scene assets
- Capture/Share-compatible render or deterministic fallback
- Shop thumbnail and detail preview
- Default fallback chain
- Catalog metadata: id, localized name, rarity, price, availability, version

### 6.2 Whole-avatar variant

Until modular compositing is visually reliable, clothes, hair, and accessories should be shipped as baked whole-avatar variants. Each variant must include all genders and states it claims to support.

Avoid advertising a ribbon, jacket, or hairstyle as independently combinable if the product actually uses baked combinations. The UI should call these `looks`, `outfits`, or `character styles` until true composition is production-ready.

### 6.3 Entitlement policy

- A skin purchase unlocks both gender presentations.
- Changing gender never removes ownership.
- Equipping is free and unlimited after purchase.
- Duplicate grants convert to a small fixed amount of P or are prevented entirely.
- A bundle discounts only items the user does not own.

## 7. Proposed six-theme catalog

| Theme | Rarity | Suggested price | Release role |
|---|---|---:|---|
| Autumn Forest Bookshop | Rare | 150P | Friendly evergreen first skin |
| Ocean Glasshouse Library | Epic | 200P | Bright summer/share-focused skin |
| Snowy Mountain Reading Cabin | Epic seasonal | 220P | Winter comfort collection |
| Hanok Dawn Study | Epic | 240P | Distinctive premium cultural theme |
| Retro-Future Neon Study Arcade | Legendary | 300P | High-impact aspirational skin |
| Celestial Observatory Academy | Legendary | 320P | Season headline / long-term goal |

Do not launch all six simultaneously. Recommended cadence:

1. Launch: Autumn Bookshop + Ocean Glasshouse
2. Week 2–3: Hanok Dawn
3. Week 4: one seasonal skin
4. Next season: one legendary headline skin

This protects choice clarity and gives every release a shareable moment.

## 8. Shop information architecture

Recommended tabs:

1. Featured — 3–5 curated items only
2. Rooms — full-scene skins
3. Looks — baked whole-avatar variants
4. Collection — owned, equipped, locked progress

Every product card must show:

- Actual artwork, never an emoji placeholder
- Ownership/equipped state
- Exact price or acquisition condition
- Both gender previews before purchase
- Supported scenes/states
- Preview button before purchase

Purchase flow:

```text
Card → full-screen preview → confirm price → atomic purchase
→ reward reveal → equip now / later → return to prior context
```

## 9. Reward design

Prefer direct cosmetic rewards for meaningful achievements. Currency alone is less memorable.

Examples:

- First 60 focused minutes: free starter badge
- 7-day streak: exclusive desk prop variant/look
- 30 completed sessions: starter outfit look
- Seasonal milestone: one guaranteed themed cosmetic

Random rewards may be used only with visible odds, duplicate protection, and a deterministic pity path. Avoid paid loot boxes.

## 10. Economic guardrails

Monitor weekly:

- Points minted vs. points spent
- Median point balance by cohort age
- Days to first purchase
- First-purchase conversion
- Equip rate within 10 minutes of purchase
- Share rate after equipping
- Catalog preview → purchase conversion
- Ad-derived share of earned points
- Percentage of users unable to afford anything after 7 active days

Warning thresholds for investigation:

- Ads produce more than 30% of points for regular users
- Median first purchase exceeds 7 active days
- More than 25% of purchases are never equipped
- Point balances continually rise while purchase conversion falls
- A single legendary item receives most spending because cheaper items feel low quality

## 11. Integrity and failure handling

- Server-authoritative point balance when backend sync is enabled
- Atomic `charge + grant entitlement` transaction
- Stable purchase idempotency key
- Catalog version stored with transaction
- Never remove equipped art before fallback is loaded
- Image fallback: equipped asset → theme default → base avatar/room → SVG
- Failed image loads do not alter ownership or equip state
- Offline purchases should be disabled or queued safely, never optimistically double-charged

## 12. Implementation phases

### Phase A — safe catalog foundation

- Define typed catalog and entitlement schema
- Use existing points and appearance state
- Add preview, purchase, owned, equip states
- Add cross-screen consistency tests
- Ship only complete whole-scene assets

### Phase B — economy validation

- Instrument earn/spend/equip/share events
- Tune price bands using median study behavior
- Add two launch themes and one starter reward
- Validate refresh persistence and failure fallbacks

### Phase C — content operations

- Seasonal catalog scheduling
- Bundles with owned-item adjustment
- Direct cosmetic achievement rewards
- Release calendar and content QA checklist

### Phase D — optional advanced customization

Only after a proven visual composition pipeline:

- Independent hair, clothes, accessory slots
- Compatibility rules and preview renderer
- Automated overlap and clipping QA
- Combinatorial snapshot testing

## 13. Definition of done for each shop item

- [ ] Product artwork approved at actual app size
- [ ] Girl and boy versions complete
- [ ] Idle, study, sleep, happy complete
- [ ] Home display verified
- [ ] Timer display verified
- [ ] Capture/Share verified
- [ ] Preview matches equipped result
- [ ] Purchase is atomic and idempotent
- [ ] Ownership persists after refresh
- [ ] Gender change retains entitlement
- [ ] Fallback chain tested with missing image
- [ ] TypeScript, lint, tests, and production build pass
- [ ] Analytics events verified

## 14. Product decision

For the current StudyLog architecture, prioritize a small number of excellent whole-scene skins over hundreds of nominal accessories. A skin that visibly transforms Timer and Capture/Share has more product value than an item that exists only in the shop list.

The near-term north star is:

> Users study because they want to unlock a scene, then share because that scene feels like theirs.
