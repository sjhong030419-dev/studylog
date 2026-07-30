# StudyLog MVP Next Phase PRD

**Version:** 1.0  
**Status:** Ready for implementation  
**Product:** StudyLog  
**Phase:** MVP stabilization and core-experience completion  
**Primary implementer:** Claude Code  

---

## 1. Mission

Complete StudyLog's core MVP experience before adding new large features.

The target experience is:

```text
Open StudyLog
→ Meet my character
→ Start studying immediately
→ Stay focused
→ Finish a session
→ See character growth and rewards
→ Receive a beautiful result card
→ Want to share it
→ Want to return tomorrow
```

The objective is not to increase the feature count.

The objective is to make this loop reliable, emotionally rewarding, and shareable.

---

## 2. Product Standard

StudyLog must feel like:

> A cozy character-growth game powered by real studying.

It must not feel primarily like:

- An analytics dashboard
- A generic timer
- A collection of unrelated study tools
- A character illustration pasted onto a productivity app

Priority:

1. Character
2. Study action
3. Completion reward
4. Shareable result
5. Growth
6. Statistics

---

## 3. Golden Rules

### Preserve existing functionality

Do not break or remove:

- Normal timer
- Pomodoro timer
- Subject selection and creation
- Session persistence
- Away/app-exit detection
- Points transactions
- Study XP
- Level progression
- Shop purchase and equipment
- Character type selection
- Profile
- Realtime study room
- Statistics
- Planner
- Capture and sharing
- Existing navigation, authentication, APIs, and Supabase behavior

### Do not expand scope

Do not add during this phase:

- AI tutor expansion
- Mentor/mentee features
- Q&A community
- School battles
- New large realtime-room systems
- Season pass
- Guilds
- Physical-goods marketplace
- Hundreds of cosmetic items
- New payment mechanics

### No fake product data

Do not fabricate:

- Rankings
- Achievements
- Study sessions
- Item ownership
- XP
- Points
- Streaks
- Goal completion

Use real data or an honest empty state.

---

## 4. Required Work Order

Complete the phases in order:

1. Full regression and visual QA
2. Stabilization fixes
3. Save a clean checkpoint
4. Character production-asset readiness
5. Result/share screen completion
6. First-user onboarding
7. Growth and reward rule consolidation
8. MVP release validation

Do not begin a later phase while a P0 issue remains in an earlier phase.

---

# PHASE 1 — REGRESSION AND VISUAL QA

## 5. Automated Baseline

Run:

```bash
npm run test
npm run build
npm run lint
```

Record:

- Test count
- Pass/fail result
- Build warnings
- Bundle sizes
- Pre-existing issues

Do not modify code merely to silence a warning without understanding its impact.

---

## 6. Manual User-flow QA

Run the application and verify every flow below.

### 6.1 Home

- Home loads without runtime errors.
- Character is the first visual focus.
- Character room is large enough to establish product identity.
- Study time remains immediately understandable.
- Primary study action is obvious.
- Statistics do not visually overpower the character.
- Speech bubble does not cover the character's face.

### 6.2 Character selection

- Change base character type.
- Confirm the preview changes immediately.
- Reload the page.
- Confirm selection persists.
- Confirm the same selection appears on:
  - Home
  - Profile
  - Shop preview
  - Pomodoro
  - Capture card
  - Realtime room

### 6.3 Shop and cosmetics

Test:

- Outfit
- Hat/hair item
- Glasses
- Headphones
- Accessory
- Background

Verify:

- Purchase succeeds only when rules allow.
- Point balance changes correctly.
- Equipped state persists.
- Preview updates immediately.
- Home updates.
- Capture output updates.
- Spending points does not lower Study XP or level.
- Advertising points do not increase Study XP.

### 6.4 Normal timer

Test:

```text
Select subject
→ Start
→ Pause
→ Resume
→ Stop
```

Verify:

- Timer accuracy
- Button state
- Session record
- Subject association
- Point reward
- Study XP
- Level calculation
- Completion character state
- Audio auto-stop behavior, if enabled

### 6.5 Away detection

Test:

- Leave during an active session.
- Return within the short-return interval.
- Leave and return after the long-return interval.

Verify:

- Timer pause/resume behavior remains correct.
- Away state is displayed.
- User can resume.
- Away duration is not counted as focused study unless existing rules explicitly allow it.

### 6.6 Pomodoro

Verify:

- Preset selection
- Custom settings
- Start
- Focus-to-break transition
- Pause/resume
- Completion
- Character states
- Session/point behavior

### 6.7 Realtime room

Verify:

- Join room
- Claim seat
- Release seat
- Status update
- Character type synchronization
- Offline state
- Many occupied seats remain responsive

### 6.8 Capture

Generate:

- Square image
- 9:16 story image

Open the actual saved files and verify:

- No share/save controls appear.
- Character is not clipped.
- Equipped outfit/accessory/background appears.
- Text is crisp.
- Korean font renders correctly.
- Study time is readable.
- Empty states do not look broken.
- No content overflows.

---

## 7. Responsive QA Matrix

Check at minimum:

| Width | Target |
|---:|---|
| 320 px | iPhone SE-class narrow viewport |
| 375 px | Standard compact phone |
| 390 px | Standard modern iPhone |
| 430 px | Pro Max-class phone |

Also test:

- Short viewport height
- Browser text scaling
- Dark mode, if supported
- Reduced-motion preference

Acceptance:

- No horizontal scroll.
- No clipped timer digits.
- No overlapping controls.
- Character face remains visible.
- Touch controls remain usable.
- Bottom navigation does not cover content.

---

# PHASE 2 — STABILIZATION

## 8. Defect Handling

For every defect found:

1. Reproduce it.
2. Identify the source.
3. Fix the smallest safe scope.
4. Add a regression test when the behavior is testable.
5. Re-run relevant user flow.
6. Run complete automated verification.

Do not combine defect fixes with unrelated refactoring.

Priority:

- **P0:** Data loss, timer failure, broken navigation, failed capture, unusable mobile layout
- **P1:** Incorrect XP/points, missing equipped cosmetics, inconsistent character, inaccessible actions
- **P2:** Minor visual mismatch, animation polish, non-blocking performance warning

---

## 9. Checkpoint

After all P0/P1 issues are resolved:

- Review `git diff`.
- Confirm no secrets or `.env` files are staged.
- Confirm build artifacts and `node_modules` are not staged.
- Confirm deleted legacy files are no longer imported.
- Save a Git checkpoint.

Recommended commit:

```text
feat: complete character-led home and MVP study loop
```

Do not create the commit if the user has not authorized committing. Instead, report that the code is ready for a checkpoint.

---

# PHASE 3 — CHARACTER PRODUCTION-ASSET READINESS

## 10. Current Art Boundary

The current SVG character is a functional placeholder and architecture reference.

Do not falsely describe it as final production pixel art.

Prepare the system so production assets can replace it without rewriting:

- Timer
- State machine
- Profile
- Shop
- Room
- Capture

---

## 11. MVP Character Asset Set

Define and document the minimum production-art set:

### Base presentation

- Base preset A
- Base preset B

Do not restrict hairstyles, clothing, colors, or accessories by base preset unless an asset is technically incompatible.

### Required states

- Idle
- Studying/writing
- Break/paused
- Sleepy
- Away/distracted
- Happy/session complete
- Level up

### Required cosmetics

- Three outfits
- Three headwear/hair accessories
- Glasses
- Headphones
- One small accessory
- Three room backgrounds

### Asset contract

Document:

- Canvas dimensions
- Anchor position
- Frame naming
- Slot
- Z-order
- Frame count
- FPS
- Transparent-background requirement
- Supported pixel density
- Fallback behavior

---

## 12. Outfit Extensibility

The current implementation may use shared top/one-piece silhouettes.

Improve the boundary so visually unique future outfits can be registered as assets without modifying the main character component.

Acceptance:

- Ordinary new outfit:
  1. Adds an asset
  2. Adds a catalog entry
  3. Requires no new item-ID conditional
- Main character renderer does not contain individual shop item IDs.
- Missing assets fall back safely.

Do not produce a large new cosmetic catalog during this phase.

---

# PHASE 4 — RESULT AND SHARE EXPERIENCE

## 13. Product Goal

The result screen should make the user think:

> “I want to share this.”

It must feel like a game-clear screen, not a study report.

---

## 14. Result Content

Use real data only:

- Today's study time
- Session time
- Subject breakdown
- Study XP earned
- Level before and after
- Goal result
- Streak
- Earned achievements
- Earned cosmetic, only if a real reward exists
- Character completion state
- Optional one-line study note

If data does not exist:

- Hide the section.
- Show an honest empty state.
- Do not fabricate a reward.

---

## 15. Result Hierarchy

Preferred order:

```text
Character celebration
→ Completion title
→ Study time
→ Study XP / level progress
→ Goal and streak
→ Subject breakdown
→ Real achievements/rewards
→ One-line note
→ Share action
```

The character must remain prominent in both square and story layouts.

---

## 16. Share Formats

Support:

- Square feed card
- 9:16 story card

Requirements:

- No interactive controls inside generated image.
- Minimum readable font size.
- Crisp output at target pixel ratio.
- Original StudyLog branding.
- Equipped character appearance included.
- Equipped room background included.
- No clipping.
- Native Web Share API where available.
- Download fallback elsewhere.
- User cancellation is not treated as an error.

---

## 17. One-line Study Note

Add only if it can be implemented without disrupting the current data model.

Suggested behavior:

- Optional
- Short length limit
- Editable before sharing
- Stored with session/result only if an existing safe persistence location exists
- Never required to finish a session

If persistence requires a database migration, stop and report the proposed schema rather than modifying production data without approval.

---

# PHASE 5 — FIRST-USER ONBOARDING

## 18. Goal

Bring a new user to their first completed study session with minimal explanation.

Target flow:

```text
Welcome
→ Choose character type
→ Set character name or nickname
→ Select initial subject
→ Set optional daily goal
→ Start first study
→ Earn first Study XP
→ See first result card
```

---

## 19. Onboarding Requirements

- Mobile-first
- Skippable where appropriate
- No more steps than necessary
- No feature tour carousel
- Explain by doing
- Do not require payment
- Do not require advanced customization
- Preserve existing users' direct entry into the app

### Completion state

Persist onboarding completion through the existing profile/local state architecture.

Do not show onboarding again after completion unless the user resets it intentionally.

### First reward

The first reward must be:

- Real
- Deterministic
- Cosmetic or progression-based
- Not random paid content
- Not dependent on watching an advertisement

---

# PHASE 6 — GROWTH AND REWARD RULES

## 20. Single Source of Truth

Define one consistent progression system:

- Study activity creates Study XP.
- Study XP creates levels.
- Levels unlock room growth and eligible rewards.
- Spendable points purchase cosmetics.
- Advertising may grant spendable points.
- Advertising must not grant Study XP.
- Spending points must not reduce Study XP or level.

---

## 21. Required Rule Documentation

Document in `docs/`:

- Study XP formula
- Level curve
- Daily Study XP cap, if any
- Room-growth thresholds
- Streak definition
- Streak timezone behavior
- Achievement conditions
- Cosmetic reward conditions
- Duplicate reward handling
- Safe-study protections
- Anti-abuse assumptions

### Healthy-study rule

Do not reward unsafe uninterrupted study duration.

Prefer rewarding:

- Consistency
- User-defined goals
- Completed focused sessions
- Returning after healthy breaks
- Weekly progress

---

## 22. Reward Event Contract

Use a deterministic reward event structure rather than inferring rewards independently on each screen.

Suggested conceptual shape:

```ts
interface StudyRewardResult {
  studyXpEarned: number
  pointsEarned: number
  previousLevel: number
  currentLevel: number
  leveledUp: boolean
  unlockedAchievementIds: string[]
  unlockedCosmeticIds: string[]
}
```

Do not introduce this structure if it requires rewriting stable timer logic immediately. First document the migration boundary and implement through an adapter where possible.

---

# PHASE 7 — MVP RELEASE VALIDATION

## 23. Release Criteria

The MVP is ready for limited external testing when:

1. Timer flows are reliable.
2. Away behavior works.
3. Study data persists.
4. Study XP and points are correct.
5. Character selection and cosmetics persist.
6. Home is character-first.
7. Square and story images generate correctly.
8. First-time users can reach their first completed session.
9. No P0/P1 issues remain.
10. Tests, build, and lint pass.

---

## 24. Small User Test Plan

Prepare the app for 5–10 testers.

Do not explain the interface before the test.

Observe:

- Can they find the study-start action?
- Do they understand what Study XP means?
- Do they notice the character first?
- Do they understand how to change appearance?
- Does completion feel rewarding?
- Would they share the result image?
- Do they want to return?

Ask:

1. What did you think this app was when you first opened it?
2. What did you notice first?
3. Was starting a study session easy?
4. Did the reward feel connected to studying?
5. Would you share the result card?
6. What would make the character feel more like yours?

Do not add requested features immediately. Group feedback by repeated problem.

---

## 25. Required Engineering Verification

Run after every phase:

```bash
npm run test
npm run build
npm run lint
```

Before release, also verify:

- No runtime console errors
- No failed network requests in core flow
- No horizontal mobile overflow
- No missing character assets
- No missing equipped items
- No share-control elements in generated images
- No sensitive `.env` data in tracked files

---

## 26. Success Criteria

This phase succeeds when:

- Users notice the character before statistics.
- Users can begin studying without confusion.
- Studying produces accurate growth.
- Completion feels emotionally rewarding.
- The result image looks share-ready without editing.
- Character appearance remains consistent across the app.
- Existing functionality remains operational.
- The codebase is ready for production character assets.
- No major new feature has distracted from the core loop.

---

## 27. Completion Report

After implementation, report:

### Phase status

For each phase:

- Completed
- Partially completed
- Blocked

### Changed files

List all changed files grouped by:

- QA/stabilization
- Character
- Result/share
- Onboarding
- Growth rules
- Tests

### Verification

Include exact results for:

```text
npm run test
npm run build
npm run lint
```

### Manual checks

List:

- Checks completed
- Device widths checked
- Generated files inspected
- Checks that still require the product owner

### Limitations

Clearly distinguish:

- Temporary SVG art
- Missing production art
- Deferred features
- Known non-blocking performance warnings

Do not claim completion if P0/P1 issues remain.

---

## 28. Final Instruction

Do not add more features merely because the architecture makes them possible.

Finish the experience that makes StudyLog unique:

```text
Study
→ Character growth
→ Emotional reward
→ Beautiful result
→ Sharing
→ Return
```

The next milestone is not “more functionality.”

The next milestone is:

> A user completes one study session and genuinely wants to share the result.

