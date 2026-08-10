# Phase 2 — Home / Timer / Capture Cross-Screen Consistency Plan

**Status:** plan only — not implemented (docs/StudyLog_Cosmetic_System_PRD_v1.0.md
Phase 2/13 scope: prepare, don't activate). No renderer priority and no
screen behavior has been changed by this plan; this document says what a
future, art-backed change would need to touch.
**Audience:** engineering (Claude Code or a human), before implementing
Phase 3 ("end-to-end equipment").

---

## 1. Where the three screens actually stand today

Checked directly against the current source, not assumed:

```bash
$ grep -n "preferFullScene" src/components/capture/LogCaptureCard.tsx src/components/home/CharacterRoomCard.tsx
src/components/capture/LogCaptureCard.tsx:289:            preferFullScene
src/components/home/CharacterRoomCard.tsx:38:          preferFullScene
```

**Both** callers pass `preferFullScene`. There is no third caller of
`RoomScene` (`grep -rn "<RoomScene" src` returns exactly these two).

| Screen | Component | `preferFullScene`? | Renders today |
|---|---|---|---|
| Home | `CharacterRoomCard` → `RoomScene` | `true` | `FullSceneRoomRenderer` |
| Timer (일반 타이머) | `CharacterRoomCard` (same component, mounted from `StudyTimer`) | `true` | `FullSceneRoomRenderer` |
| Capture (square + 9:16) | `LogCaptureCard` → `RoomScene` | `true` | `FullSceneRoomRenderer` |
| Profile / Shop preview | `CharacterView` directly (no `RoomScene`) | n/a | `PixelSpriteRenderer` once ready, else `ChibiFallbackArt` |

**Home, Timer, and Capture are already consistent with each other today** —
all three currently show the same full-scene baked illustration, ignoring
equipped cosmetics, because all three pass `preferFullScene`. (An earlier
version of this document incorrectly stated that Capture used the layered
renderer already and would pick up new assets automatically — that was
true only briefly, before `preferFullScene` was added to `LogCaptureCard`
in a later review round. It is corrected here.)

Profile and Shop already show real equipped cosmetics via `CharacterView`
directly (no `RoomScene` involved there at all) — that consistency gap is
between "the two room screens + capture" vs. "profile/shop," not between
Home/Timer and Capture.

---

## 2. What happens once the vertical-slice assets land, with no other change

Per `src/character/room/RoomScene.tsx`'s actual dispatch order:

```text
if (shouldUseFullScene({ preferFullScene, fullSceneLoadFailed })) → FullSceneRoomRenderer
else if (shouldUsePixelRoom(...)) → PixelRoomRenderer
else → LegacySvgRoomRenderer
```

`shouldUseFullScene` returns `preferFullScene && !fullSceneLoadFailed` —
it does **not** check whether the layered room is ready. So even once every
file in `docs/First_Vertical_Slice_Asset_Request.md` is confirmed and
`shouldUsePixelRoom(...)` starts returning `true`, **Home, Timer, and
Capture keep showing `FullSceneRoomRenderer` unchanged**, because all three
pass `preferFullScene`. Confirming assets alone changes nothing visible on
any of the three screens.

(The only screens that would pick up the new cosmetics automatically today
are Profile and Shop, since `CharacterView` there doesn't go through
`RoomScene`/`preferFullScene` at all — but Phase 2's slice is scoped to the
room+desk-prop combination, which those two screens don't render.)

---

## 3. The one coordinated switch needed (not yet made)

Because Home, Timer, and Capture all reach the exact same
`shouldUseFullScene`/`RoomScene` dispatch code, this is a **single code
change**, not three separate per-screen changes:

**File:** `src/character/room/fullSceneState.ts` (`shouldUseFullScene`) and/or
`src/character/room/RoomScene.tsx` (the dispatch order itself).

Target end-state (PRD §10 "Full-scene migration" step 5 — "Switch Home,
Timer, and Capture to the same layered renderer" — and step 1 — "Keep the
current flattened full-scene art as a fallback and art reference"):

```text
RoomScene
 ├─ PixelRoomRenderer      (primary, once ready — real equipped state)
 ├─ FullSceneRoomRenderer  (fallback — room not ready yet, or a critical
 │                          layer failed to load at runtime)
 └─ LegacySvgRoomRenderer  (final safety net — pixel room unavailable AND
                             full-scene image also failed)
```

Concretely:

1. Change `shouldUseFullScene` so it only prefers the full scene when the
   layered room is *not* ready — e.g. `preferFullScene && !fullSceneLoadFailed
   && !shouldUsePixelRoom(...)` — so `PixelRoomRenderer` takes priority the
   moment it's ready, and `FullSceneRoomRenderer` becomes the fallback for
   "not ready yet" or "failed," not the default.
2. Because this is one shared function/dispatch, the change applies to
   `CharacterRoomCard` (Home + Timer) and `LogCaptureCard` (both capture
   formats) simultaneously — no per-screen edit needed once this is
   changed. `CharacterRoomCard`/`LogCaptureCard` can keep passing
   `preferFullScene` unchanged (it now means "prefer full-scene when the
   layered room isn't ready," which is true for both callers).
3. Verify `PixelRoomRenderer` + `PixelSpriteRenderer` together reproduce the
   38–45% character-height/no-clipping guarantees `CharacterRoomCard`
   currently gets from `FullSceneRoomRenderer` at `characterScale={1.3}` —
   this ratio math already exists (`resolveCharacterHeightRatio` in
   `roomAssetManifest.ts`) and already has regression tests
   (`roomAssetManifest.test.ts`), but was written before Home/Timer ever
   actually rendered through this path in production — re-verify at
   320/390/430px specifically on the Home/Timer screen, not just in
   isolation.
4. Re-verify the LogCaptureCard layout-budget fix from `fix: scope and
   optimize timer room scenes`/the later capture-card review still holds
   once the layered renderer (not the full-scene image) is what's actually
   inside the capture card's scene box — the height/overflow math there was
   tuned against the full-scene image's specific rendered proportions.
5. Manually re-check the speech-bubble-never-covers-face guarantee
   (`CharacterRoomCard.tsx`'s speech bubble sits outside the room card's
   bounds already, independent of which renderer is inside it — should hold
   unchanged, but confirm visually once real art is in).

**This is explicitly out of scope for the current task** — no file in this
section has been touched. It's the next concrete step once Phase 2's assets
are real and confirmed (`docs/First_Vertical_Slice_Asset_Request.md` §4
step 6 points back here), and it needs its own visual QA pass, not just
"tests pass."

---

## 4. Why `LegacySvgRoomRenderer` and `FullSceneRoomRenderer` both stay

Per the golden rules (`docs/StudyLog_Cosmetic_System_PRD_v1.0.md` §3, this
session's own repeated instruction): neither renderer is deleted at any
point in this plan. Every fallback transition already has a tested trigger
(`shouldUsePixelRoom`, `shouldUseFullScene`, `onCriticalLayerError`,
`onError`) — §3 above only reorders which one is *tried first*, it does not
remove any of them or change how a failure is detected.
