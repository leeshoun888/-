# Design QA

## Evidence

- Source visual truth: `../design-references/selected-option-1.png`
- Previous finale source capture: `qa/finale-before-v3-390x844.png`
- Finale comparison strip: `qa/finale-comparison-v3.png`
- Implementation captures:
  - `qa/finale-convergence-v3-390x844.png`
  - `qa/finale-gift-hold-v3-390x844.png`
  - `qa/finale-open-v3-390x844.png`
  - `qa/finale-reveal-v3-390x844.png`
  - `qa/implementation-map-v2-390x844.png`
  - `qa/implementation-map-focus-v2-390x844.png`
- Viewport: 390 × 844 CSS pixels
- Finale states: journey → ten-planet convergence → gift hold → opened gift burst → physical-gift reveal

## Full-view comparison

`qa/finale-comparison-v3.png` places the previous finale and all four new finale states in one normalized comparison input. The update preserves the same navy star field, peach low-poly planet, cream display typography, heart-shaped star trail, and coral/gold palette. The added states intensify the finale without changing the established visual language or the final real-world gift handoff.

| Fidelity surface | Result | Evidence |
| --- | --- | --- |
| Fonts and typography | Passed | Jua display type, Gowun Dodum support copy, cream hierarchy, line height, and mobile wrapping remain consistent across all five frames. |
| Spacing and layout rhythm | Passed | Each 390 × 844 state maintains safe top copy, a centered visual focus, and reachable controls with no clipping or horizontal overflow. |
| Colors and tokens | Passed | Existing navy, coral, peach, cream, and lavender tokens carry through the darker cinematic phases with sufficient contrast. |
| Image quality and asset fidelity | Passed | Closed/open gift sprites are real generated low-poly assets, compressed WebP with alpha, and show no actionable chroma fringe at mobile scale. The ten orbiting planets reuse the approved map assets. |
| Copy and content | Passed | “총총이에게 선물을 받으세요!” remains exact; new copy stays romantic, concise, and consistent with 꽁알이/총총이 naming. |

## Focused-region comparison

A separate crop was not required. At 390 × 844, the full-size state captures clearly expose the Korean typography, progress meter, gift transparency edges, icon particles, CTA labels, and reveal card at inspection scale. The five-frame strip additionally verifies state-to-state alignment and visual continuity.

## Findings

- No actionable P0, P1, or P2 differences remain.
- P3: physical-device speaker volume and haptic strength can vary by browser and phone; this does not block the experience because all cues have visible equivalents.

## Functional QA

- Final journey drag enters the cinematic sequence: passed.
- Ten memory planets converge around the gift and transition automatically: passed.
- Gift interaction supports a 1.5-second hold and a four-tap accessibility fallback: passed.
- Opened gift state triggers heart/star/sparkle burst and transitions to the reveal: passed.
- Final physical-gift handoff copy remains exact: passed.
- Finale sound toggle remains available: passed.
- Browser console warnings/errors across journey, convergence, hold, open, and reveal states: none.
- Production build: passed.
- New gift image payload: 92 KB total across two WebP assets.

## Comparison history

1. The original finale jumped from the drag directly to the reveal, so it lacked the requested celebratory payoff.
2. Added three intermediate states: ten-planet convergence, player-held gift opening, and opened-gift burst.
3. Generated matching closed/open low-poly gift assets and removed their chroma backgrounds. A thin fringe found during asset inspection was corrected with a one-pixel edge contraction before WebP export.
4. Browser QA found that repeated taps reset to 25% because pointer release cleared progress. Pointer release now preserves progress, and the four-tap fallback was retested at 25%, 75%, and completion.
5. The revised 390 × 844 captures were compared together in `qa/finale-comparison-v3.png`; no P0/P1/P2 issues remain.

## Implementation checklist

- [x] Preserve the existing final handoff message.
- [x] Add real matching gift assets rather than code-drawn artwork.
- [x] Add reversible player interaction with accessible fallback.
- [x] Add layered 3D motion, synthesized arrival/opening cues, and haptics.
- [x] Verify all main states in the in-app browser at 390 × 844.
- [x] Check console and production build.

## Final result

passed
