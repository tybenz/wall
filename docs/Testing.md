# Hands-on v1 testing

Run `npm run dev` and open its `/wall/` URL. Use a desktop browser with WebGL for the drawings.

1. Check the finished front composition: cabinet shape/fluting/feet, white slab, rounded wall ribs, TV silhouette and soundbar.
   Check the vaulted outline: both edges 108 inches, ceiling at beam 115 inches, beam underside 112 inches. In Surfaces, edit these heights, beam width and beam offset; the drywall, slats and framing should follow the profile.
2. Select Isometric, then Side. Use Fit or zoom buttons. Camera changes must not alter the layout.
3. Step through all five inspection levels. Change camera halfway through; the inspection level should stay selected. Inside wall should show studs, blocking and separate schematic cable routes.
4. Click the edit button beside Panel width. Surfaces should open with White panel width focused and selected. Type a valid value; the drawing and annotation should update immediately. Try panel height and projection too.
5. Focus different drawer fields; their dimensions should become prominent. Hover annotations and test Tab/Enter/Escape. Derived TV bottom should explain its center-height/body-height calculation.
6. Edit part dimensions and finish colors. Rotate the soundbar and examine it from the side. Check that provisional notes remain visible.
7. In Structure, replace the comma-separated stud offsets and apply them. In Electrical, put a box over a stud or blocking and inspect the conflict message.
8. Save locally, make another edit, then Load. Reload the page: only the saved design should return. Export a file, reset, then import it. Invalid JSON must show an error without losing the open design.
9. Resize the browser. The scene should refit and the drawer should stay usable. On narrow screens the drawer overlays the drawing.

For feedback, include the view, inspection level, field/value changed and what looked wrong. The goal is composition/inspection quality, not construction approval.
