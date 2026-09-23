# Room-to-terminal transition refinement

## Changes
- Replace the current simple camera push with a continuous, layered move toward the MacBook: foreground depth shift, focused light pull, brief lens compression, and a restrained terminal wake pulse.
- Make dust visibly float throughout the full room, with varied sizes, depths, speeds, and blur while keeping it atmospheric.
- Keep the viewport locked during the transition so the browser scrollbar never flashes.

## Technical details
- Preserve the uploaded room photograph and existing rain/window layers.
- Reuse the same room layers across the handoff to avoid a black frame or visual jump.
- Respect reduced-motion preferences with a direct, non-animated handoff.
- Verify the full transition at the current narrow viewport and desktop size.
