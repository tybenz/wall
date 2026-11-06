# Hands-on v1 testing

Run `npm run dev` and open its `/wall/` URL. Use a desktop browser with WebGL for the drawings.

1. Check the finished front composition: cabinet shape/fluting/feet, white slab, rounded wall ribs, TV silhouette and soundbar.
   Check the vaulted outline: both edges 108 inches, ceiling at beam 115 inches, beam underside 112 inches. In Surfaces, edit these heights, beam width and beam offset; the drywall, slats and framing should follow the profile.
2. Select Isometric, then Side. Use Fit or zoom buttons. Camera changes must not alter the layout.
3. Drag the Inspection depth slider through all five stops. Check arrow keys and Home/End; only the selected stop name is shown beside the compact slider. Change camera halfway through; the inspection level should stay selected. Inside wall should show studs, blocking and separate schematic cable routes, with no front spacers or lag guides.
   Behind TV and every deeper level hide the console, revealing lower wall electrical. Returning to Finished shows the console again.
4. Click the edit button beside Panel width. Surfaces should open with White panel width focused and selected. Type a valid value; the drawing and annotation should update immediately. Try panel height and projection too.
5. Focus different drawer fields; their dimensions should become prominent. Hover annotations and test Tab/Enter/Escape. Derived TV bottom should explain its center-height/body-height calculation.
   Each numeric input has a slider. Drag for half-inch steps and hold/release Shift during a drag for quarter-inch steps. Arrow keys use the same increments; Home/End reach the range limits. Test inches and millimeters (physical increments stay 12.7/6.35 mm), exact text entry and a text-entered value outside the usual slider range. TV/console stay centered on the wall, and the panel stays centered on the TV.
6. In Behind panel, check the perimeter frame and two internal spacers at 16 inches on center. In Behind TV, check the electrical plates center below the bracket with 2 inches of clear separation. Change mount position/height and verify the plates follow. In Finished/Side, check the cradle and the derived TV-bottom-to-cradle-bottom dimension, with a 0.25-inch TV-to-soundbar gap.
7. Edit part dimensions and finish colors. Rotate the soundbar and examine it from the side. Check that provisional notes remain visible.
8. In Structure, replace the comma-separated stud offsets and apply them. In Electrical, put a box over a stud or blocking and inspect the conflict message.
9. Save locally, make another edit, then Load. Reload the page: only the saved design should return. Export a file, reset, then import it. Invalid JSON must show an error without losing the open design.
10. Resize the browser. The scene should refit and the drawer should stay usable. On narrow screens the drawer overlays the drawing.

For feedback, include the view, inspection level, field/value changed and what looked wrong. The goal is composition/inspection quality, not construction approval.
