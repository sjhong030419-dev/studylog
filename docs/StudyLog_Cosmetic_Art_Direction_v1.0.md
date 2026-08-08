# StudyLog Cosmetic Art Direction

**Version:** 1.0  
**Status:** Draft visual direction — awaiting product-owner approval  
**Reference board:** `docs/assets/cosmetic-proofs/girl-study-customization-board-v1.png`

## 1. Locked character identity

All cosmetics must preserve:

- Brown bob haircut silhouette unless a hairstyle item explicitly replaces it
- Large warm-brown eyes
- Round chibi face and light blush
- Existing seated writing pose, hands, pencil, book, and desk anchors
- Cozy pixel-art rendering, outline weight, and warm StudyLog lighting
- Identical scale and position across every equipped combination

Cosmetics may not silently change the face, body proportions, pose, desk, or book.

## 2. Initial visual set

| Visual set | Outfit slot | Accessory slot | Proposed role |
|---|---|---|---|
| Lavender study set | Lavender zip hoodie | Lavender ribbon | First point-purchase set |
| School study set | Dusty-blue cardigan | Round glasses | Academic collection |
| Cozy focus set | Cream cable-knit sweater | Lavender headphones | Focus/ASMR collection |
| Sleepy study set | Soft-pink pajama cardigan | Gold star hairpin | Evening collection |

Each row is a preview combination, not a bundled render. Outfit and accessory assets must be exported independently and remain freely mixable.

## 3. Required independent slots

- `hair`: replaces the complete hairstyle using separate back/front layers
- `outfit`: replaces the visible torso clothing
- `headAccessory`: ribbon, star hairpin, hat, headphones where appropriate
- `faceAccessory`: glasses
- `neckAccessory`: necklace, scarf, collar accessory
- `handheld`: future study tool; pencil remains part of the base study pose for the first slice

No accessory is required. Removing one must restore a valid accessory-free character.

## 4. First production assets

Produce the `girl/study` state first:

1. Bare base body/face/hands
2. Default hair back
3. Default hair front
4. Default outfit
5. Lavender hoodie
6. Lavender ribbon
7. Round glasses
8. Lavender headphones
9. Cream knit sweater
10. Pink pajama cardigan
11. Gold star hairpin

All files use the 160 × 160 RGBA contract and exact shared anchors from `StudyLog_Asset_Layer_Spec_v1.0.md`.

## 5. Approval gate

Do not expand to `idle`, `sleep`, `happy`, boy variants, or the full 64-file production set until the product owner approves:

- Character identity
- Pixel density
- Outfit silhouettes
- Accessory scale and placement
- Overall palette

After approval, preserve the approved `girl/study` geometry exactly while adapting each state.
