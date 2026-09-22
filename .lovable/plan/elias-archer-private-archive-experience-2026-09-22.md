# Elias Archer — Private Archive Experience

## Experience flow

Build the entire experience at `/` as a cinematic state-driven journey:

```text
Manor entrance → corridor → first left turn → interior → second left turn
→ Elias Archer’s private bedroom → room reveal → bedroom desk/computer
→ interactive computer → Welcome Back screen → private archive
```

- Create a continuous-feeling first-person manor sequence using cinematic manor artwork, layered depth, controlled camera pans/zooms, light shifts, and seamless match transitions rather than separate webpage slides.
- Make the bedroom a spatially believable continuation of the same manor, never a generic office, hotel room, standalone desk room, or disconnected page.
- Establish the bedroom through one controlled camera move that progressively reveals the bed, dark-wood furniture, trophy shelves, perfume display, garden-facing windows, polished desk, and finally the clearly interactive computer.
- Keep the room luxurious but lived-in through subtle personal objects and decoration. Include several elegant trophies with one understated Muay Thai competition trophy, plus several curated perfume bottles on a separate shelf or display area.
- Treat the trophy and perfume bottles as silent environmental foreshadowing only: add no explanatory labels, Appearance references, Passion section, biography, or inferred lore.
- End with the desk/computer as the final visual focal point. Clicking it plays the interaction, pushes the camera into the screen, and transitions into the archive.
- Add a restrained mouse-reactive welcome screen containing exactly “Welcome Back”, “Elias Archer”, and “Click anywhere to continue”.
- Respect reduced-motion settings with an elegant shortened version, and provide an unobtrusive skip option for repeat visits.

## Visual production

- Generate a cohesive set of dark, aristocratic manor environments: entrance, connected corridors, two left turns, and Elias’s private bedroom with a bed, shelves, dark-wood furniture, garden-facing windows, and polished computer desk.
- Maintain continuous architecture, materials, charcoal/forest-green/muted-burgundy/warm-ivory color, restrained brass, and cinematic lighting across every manor view.
- Remove the backgrounds from both supplied Elias images while preserving the character’s recognizable face, hair, glasses, clothing, pose, proportions, and armband.
- Keep the images strictly separated:
  - Rose image: relationship profile and its enlarged viewer only.
  - Bowing image: the sole Appearance image only.
- Build a charcoal, forest-green, muted-burgundy, warm-ivory, dark-wood, and restrained brass design system with editorial serif headings, modern sans-serif text, grain, shadow, and polished surfaces.

## Sound and controls

- Add a tasteful cinematic entrance score plus restrained footsteps, doors, room ambience, desk/computer interactions, archive transitions, node interactions, image-viewer sounds, and Appearance/Backstory cues.
- Start audio only after the browser receives user interaction, fade sounds between stages, and provide one persistent mute/unmute control.
- Keep audio optional: the full experience remains understandable and functional when muted.

## Private archive

Create custom archive navigation with animated transitions among three sections:

### Relationship Chart
- Render a data-driven relationship network with Elias as the only node and no edges or percentages.
- Give the central node refined hover/focus/touch feedback and open a dedicated profile panel on activation.
- Show only the background-removed rose image and the exact sentence: “This is me, what the fuck do you want me to add onto that”.
- Add a keyboard- and touch-accessible image viewer with dimming, subtle background blur, smooth enlargement, and smooth return.
- Include all 12 supplied relationship categories as a compact visual legend with distinct line/pattern treatments, while keeping the underlying data structure ready for future characters and mixed-percentage relationships.

### Appearance
- Transition to a distinct luxury-dossier composition with the background-removed bowing image as the one and only character image, entering from the right and remaining visually dominant.
- Add subtle, touch-friendly callouts for Hair, Eyes, Glasses, Skin tone, Face, Height, Body/build, Uniform, Prefect armband, Accessories, and Overall style.
- Use only explicitly supplied appearance facts and details clearly visible in the bowing image. Where the prompt provides no safe description, use exactly “No additional details recorded.”
- Keep all non-appearance facts out of these callouts, including Muay Thai, cologne, scent, brass knuckles, personality, family information, and biography.
- Support hover previews, click/tap pinning, focus states, connecting lines, and labels positioned away from Elias’s face.

### Backstory
- Create an intentionally sparse unfinished archive showing only “WIP” and “Work in Progress for now”.
- Use archival fragments, restrained construction stripes, animated drafting lines, and partially concealed interface details without adding any story or lore.

## Content safeguards

- Store only the current version’s approved facts in one typed data file so display text stays consistent.
- Current basic information is limited to: Elias Archer, He/Him, 6'2", English, Kitagawa High, London-born child heir of “Archer Bionat”, and part of the prefect programme.
- Do not invent any grade, class, teachers, classmates, school history, activities, or other lore for Kitagawa High.
- Do not display or otherwise use the following canonical but future-only details in the current build: Muay Thai, cologne interest, Madagascar vanilla and musk scent, brass knuckles, arrogance, polished personality, sharp-tongued personality, or the supplied personality context involving his sister.
- Do not implement future Passion, Biography, additional-character, additional-lore, or similar sections yet; keep the architecture ready for them without exposing their content.
- Never create or display an age, sister’s name, other characters, relationships, family details, extra locations, hobbies, abilities, traits, physical details, or backstory.
- Treat the manor as atmosphere only, never as character biography.

## Responsive and accessibility work

- Recompose the manor framing, archive navigation, legend, profile panel, and Appearance callouts for tablet and mobile rather than shrinking the desktop view.
- Make all interactions keyboard- and touch-operable; add visible focus states, meaningful image text, viewer dismissal with Escape, motion reduction, and sufficient contrast.
- Preserve stable layouts so transitions and labels do not overlap the character or resize unexpectedly.

## Technical structure

- Split the experience into focused React components for the cinematic intro, desk, welcome screen, archive shell, relationship map, image viewer, appearance dossier, backstory placeholder, audio controller, and transition layer.
- Use declarative stage/state transitions and data-driven character, relationship, legend, and hotspot definitions.
- Add route-specific metadata for Elias Archer and remove all template branding.
- Verify the complete flow on desktop and mobile, including image-role separation, hotspots, viewer close behavior, navigation, mute control, reduced motion, and the absence of age, future-only facts, or invented character information.
