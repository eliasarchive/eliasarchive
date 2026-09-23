# Scripted entrance rain

## Build
- Keep the supplied `RAIN MANOR` photograph completely static and remove the generated rain video from the entrance.
- Add a canvas rain layer above the photograph with varied drop lengths, speeds, opacity, wind, and depth.
- Constrain ground impacts to the driveway/concrete using a perspective-shaped mask matching the circled area; impacts will create short-lived splashes and elliptical ripples only inside that mask.
- Preserve the current rain sound and all later manor scenes unchanged.

## Verification
- Check desktop and phone layouts to confirm rain falls naturally, ground effects never appear on the building or lawn, and controls remain unobstructed.
- Confirm reduced-motion visitors receive a calm static entrance photograph and the page has no browser errors.

## Technical details
- Use one device-pixel-ratio-aware canvas, `requestAnimationFrame`, pooled particles, and resize handling for smooth rendering.
- Remove entrance video preloading and rendering; retain image preloading.
