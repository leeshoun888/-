# Design QA

## Baseline

- Reference: `../design-references/selected-option-1.png`
- Implementation capture: `qa/implementation-map-390x844.png`
- Side-by-side comparison: `qa/design-comparison.png`
- Viewport: 390 × 844 CSS pixels
- State: first unlocked memory planet, 0% restored

## Visual comparison

The implementation preserves the selected reference's defining hierarchy and atmosphere: deep navy star field, peach low-poly planet, centered polaroid memory, ten-node progress rail, coral primary action, and cream display typography. The live UI intentionally replaces the reference's sample title/photo with the couple's first supplied date and caption-derived chapter copy.

| Area | Result | Evidence |
| --- | --- | --- |
| Composition | Passed | Header, progress rail, chapter copy, planet, photo, and CTA follow the same vertical structure. |
| Color and lighting | Passed | Navy/coral/cream palette and soft planetary glow match the selected direction. |
| Typography | Passed | Rounded Korean display face and restrained supporting type maintain the playful-romantic tone. |
| Mobile fit | Passed | No clipping or horizontal overflow at 390 × 844; primary controls remain inside safe margins. |
| Interaction affordance | Passed | Progress nodes, sound control, photo controls, missions, and final drag target have clear states. |

## Functional QA

- Intro → map → all photos in chapter 1 → mission → next planet: passed.
- Tap, swipe, long-press/tap fallback, and drag mission mechanics: passed.
- Finale drag → exact physical-gift handoff message: passed.
- Browser console warnings/errors: none.
- Production build: passed.
- Photo manifest: 74 photos across 30 dates; 0 missing files and 0 empty dates/captions.

## Iteration history

1. Initial implementation matched the selected low-poly memory-planet concept.
2. Browser QA exposed unreliable drag completion under pointer automation; mission and finale drag controls were changed to explicit pointer tracking and retested successfully.
3. Long-press mission gained an accessible repeated-tap fallback while retaining the intended hold interaction.

## Final result

Passed — no P0, P1, or P2 visual or functional issues remain.
