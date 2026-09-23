# Replace the AI manor sequence with real photographs

## Goal
Replace every opening manor still with a coherent set of genuine photographs from Harlaxton Manor, while retaining the cinematic journey and rain atmosphere.

## Changes
- Use four credited, repository-hosted Harlaxton Manor photographs for the entrance, stairwell, gallery, and final study.
- Keep the rain as a visual effect over the genuine exterior photograph rather than using the previous AI rain video.
- Place the terminal interaction directly over a computer screen composited into the final real study photograph, then align the zoom origin and responsive hotspot to it.
- Remove the artificial grain overlay from the manor journey and desk scene so the real photos stay clear.
- Preserve the existing scene transitions, labels, controls, sound flow, and all archive content.
- Include a source file listing each photograph’s Wikimedia Commons page, creator, and license.

## Technical details
- New local assets live in `src/assets/` and will deploy with GitHub Pages.
- The computer screen will be a restrained CSS interface element, not a replacement or generated room image.
- Desktop and mobile hotspot coordinates will be checked against the new final composition.
