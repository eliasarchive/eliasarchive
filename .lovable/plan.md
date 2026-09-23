# Rebuild the final-room window rain

## Goal
Create a convincing inside-looking-out effect without changing the original room photograph: heavy rain falls outdoors only within the individual glass panes, while separate water beads and trails move on the glass.

## Implementation
- Replace the current single rain canvas with two independently animated canvases using the existing hand-traced pane mask.
- **Outside rain layer:** increase density and visibility, vary depth, length, speed, angle, brightness, and opacity, and add subtle distant rain haze. Keep it behind the photographed glass and all room/window structure.
- **Glass droplets layer:** add stationary beads, slow sliding droplets, merging behavior, and short wet trails. Clip every droplet to the same exact panes and place this layer above the photographed glass but below the interior/window-frame layer.
- Preserve the original room image and its image quality. Keep mullions, frame, curtains, chair, laptop, desk, and walls fully in front of both effects.
- Apply the same correct layer stack in the room scene and the close terminal view.

## Layer order
```text
front
interior, furniture, curtains, window frame and mullions
glass droplets and trails
photographed window glass
heavy rain outside
original outdoor background
back
```

## Verification
- Play through the entrance sequence into the room on desktop and phone-sized viewports.
- Confirm rain and droplets are absent from every non-glass pixel and never cross frames or furniture.
- Confirm both effects remain aligned during the terminal zoom and no browser errors appear.
