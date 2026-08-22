# StudyLog Skin Concept Catalog v1.0

> Status: Concept artwork prepared; runtime integration not started.  
> Asset strategy: Baked full-scene artwork to avoid visual overlap and layer mismatch.

## Shared production format

Each contact sheet contains eight scenes:

| Row | Column 1 | Column 2 | Column 3 | Column 4 |
|---|---|---|---|---|
| Girl | Idle | Study | Sleep | Happy |
| Boy | Idle | Study | Sleep | Happy |

The current files are original high-resolution concept masters. Before runtime integration, export deterministic per-cell assets at the exact dimensions required by Home, Timer, and Capture/Share. Do not reference contact sheets directly from production UI.

## 1. Autumn Forest Bookshop

- ID: `autumn-forest-bookshop-v1`
- Mood: amber afternoon, independent bookstore, quiet academic warmth
- Palette: rust, walnut, mustard, forest green, cream
- Signature elements: leather chair, brass lamp, maple leaves, cinnamon tea, orange tabby
- Recommended tier: Rare / 150P
- Best use: first paid-by-points room skin; broad appeal and strong readability
- Master: `docs/assets/skin-concepts-batch-v1/autumn-forest-bookshop-v1/room-contact-sheet-original.png`

## 2. Ocean Glasshouse Library

- ID: `ocean-glasshouse-library-v1`
- Mood: open summer air, bright focus, vacation study diary
- Palette: aqua, sea-glass mint, coral, sand, white
- Signature elements: panoramic ocean, shell books, tropical plants, lemonade, sleepy white pet
- Recommended tier: Epic / 200P
- Best use: summer campaign and bright SNS share cards
- Master: `docs/assets/skin-concepts-batch-v1/ocean-glasshouse-library-v1/room-contact-sheet-original.png`

## 3. Snowy Mountain Reading Cabin

- ID: `snowy-reading-cabin-v1`
- Mood: protected winter hideaway, fireplace comfort
- Palette: warm wood, cream knit, pine green, burgundy, snow blue
- Signature elements: mountain snowfall, stone fireplace, cocoa, candles, white cat
- Recommended tier: Epic seasonal / 220P
- Best use: winter season, long-focus sessions, holiday campaign
- Master: `docs/assets/skin-concepts-batch-v1/snowy-reading-cabin-v1/room-contact-sheet-original.png`

## 4. Hanok Dawn Study

- ID: `hanok-dawn-study-v1`
- Mood: calm new beginning, quiet dawn discipline
- Palette: celadon, indigo, rice-paper cream, warm wood, dawn peach
- Signature elements: lattice window, misty mountains, moon jar, inkstone, paper lamp, cream Jindo puppy
- Recommended tier: Epic / 240P
- Best use: distinctive StudyLog signature theme and New Year campaign
- Master: `docs/assets/skin-concepts-batch-v1/hanok-dawn-study-v1/room-contact-sheet-original.png`

## 5. Retro-Future Neon Study Arcade

- ID: `neon-study-arcade-v1`
- Mood: playful late-night energy without aggressive cyberpunk styling
- Palette: electric cyan, magenta, lavender, deep navy, coral
- Signature elements: neon skyline, glowing desk, arcade controls, robot cat
- Recommended tier: Legendary / 300P
- Best use: aspirational headline skin and high-impact share card
- Master: `docs/assets/skin-concepts-batch-v1/neon-study-arcade-v1/room-contact-sheet-original.png`

## 6. Celestial Observatory Academy

- ID: `celestial-observatory-academy-v1`
- Mood: magical scholarship, night exploration, premium collection
- Palette: midnight navy, violet, antique gold, candle amber
- Signature elements: telescope, crescent window, star globe, celestial books, round owl-like pet
- Recommended tier: Legendary / 320P
- Best use: season headline, achievement prestige, long-term point goal
- Master: `docs/assets/skin-concepts-batch-v1/celestial-observatory-academy-v1/room-contact-sheet-original.png`

## Recommended release order

1. Autumn Forest Bookshop — economy onboarding
2. Ocean Glasshouse Library — share-rate test
3. Hanok Dawn Study — StudyLog signature differentiation
4. Snowy Mountain Reading Cabin — seasonal release
5. Retro-Future Neon Study Arcade — legendary aspiration
6. Celestial Observatory Academy — season finale/headline

## Art QA before implementation

- [ ] Crop all eight cells using one deterministic grid
- [ ] Confirm no state contains changed identity or missing prop
- [ ] Confirm female and male scenes use the same room geometry
- [ ] Verify character face at mobile Timer size
- [ ] Verify desk does not cover hands unnaturally
- [ ] Produce shop thumbnail from actual final art
- [ ] Produce Capture/Share crop, not an independently redrawn substitute
- [ ] Optimize file size without visible color banding
- [ ] Add fallback metadata before catalog activation
- [ ] Keep the concept master unchanged for future re-export

## Next art batch candidates

High-priority future themes, chosen to avoid duplicating the current six:

- Spring greenhouse apothecary
- Desert night caravan library
- Cloud-top sky train study car
- Deep-sea aquarium archive
- Moon-base botanical lab
- Cozy bakery before opening
- Classical music practice library
- Camping tent under fireflies

Create new themes only when the current catalog has a defined release slot. More artwork is useful; an unmaintainable live catalog is not.
