# Architecture

## Data flow

```text
React input → DesignerController → Project validation → ResolveAssembly
                                 ↓
                      immutable DesignerStore snapshot
                                 ↓
          React drawing + SVG annotations + distances drawer
```

`App.tsx` only supplies a controller and mounts `DesignerWorkspace`. `Main.tsx` creates a workspace-owned controller and injects browser persistence. There is no router or global controller singleton.

## Modules and interfaces

- **designer** owns the Project, domain actions, immutable store and workspace composition. `setDistance`, `setProductDimension`, `setStuds`, `setFinish` and `setSoundbarOrientation` validate before resolving and publishing. Invalid changes publish nothing. `getSnapshot()` retains identity between changes; `subscribe()` returns an unsubscribe function. The React adapter is only `useSyncExternalStore`.
- **products** contains generic, sourced millimeter dimensions and appearance parameters. Detailed vendor mappings and research are local-only in `.tmp/`.
- **geometry** resolves the complete assembly and selected conflict findings without React or browser dependencies. `ResolveConstruction` generates stud/blocking/support/box envelopes and cable polylines from explicit project inputs. Bounds are minimum X/Y/Z plus positive extents.
- **project** validates strict schema-version-2 JSON, encodes/decodes files, and defines the injected read/write persistence interface. Bad/oversized/incompatible imports do not replace the current project. Local storage failures remain recoverable through export. The earlier foundation schema was never a saved-project format and is intentionally not migrated.
- **viewer** owns a separate vanilla controller/store for camera presets, inspection levels, zoom, layer toggles, dimensions, drawer selection and focus requests. `UseView` is the thin subscription adapter. Each edit request increments a focus request counter so repeated clicks can reselect the same field.
- **viewer/drawings** contains parameterized product and construction renderers. React Three Fiber draws the shared millimeter assembly. Normalized rounded geometry, procedural textures and instanced ribs provide detail without external image requests or product branding. Scene rendering is lazy-loaded.
- **viewer/annotations** projects world coordinates using the same orthographic camera as the canvas. Preset dimensions stay subtle; hover and focus increase emphasis. Focused drawer fields add their annotation where necessary. Stable FieldId values connect SVG edit buttons to inputs; derived dimensions point to controlling inputs and an explanation.
- **editor** contains grouped drawer controls and input presentation. React handles temporary number strings, DOM focus/selection, scrolling and validation messages; business rules remain in the controller/schema. Drawer scrolling does not move the main document.

`DistanceInput` composes exact text entry with reusable `DistanceSlider`. `SliderRanges` owns field-specific interaction ranges and zero-based snapping in millimeters: half-inch steps, quarter-inch steps with Shift. Sliders never quantize existing values on render. Valid text entries outside the usual interaction range expand it; the range stays stable while the slider has focus. Arrow keys add the selected increment to the exact current value. Centering is fixed for the TV, console and panel; legacy offsets are removed on project load.

## Spatial conventions and initial relationships

X starts at the left wall edge; Y starts at finished floor. Z=0 is the existing drywall front face, with positive Z into the room. All domain lengths are millimeters. UI conversion occurs at input/output seams.

`WallProfile` resolves independent left/right ceiling heights, the beam position and its underside notch. Drywall and slat backing share that polygon; ribs and studs stop at its local cut height. Initial wall width is 103 inches, both edges are 108 inches, and the ceiling meets the beam at 115 inches with its underside at 112 inches. The nominal 1 × 8 wrapper uses an explicitly provisional 7.25-inch face width. Beam depth into the room is a short context preview. Saved rectangular projects receive the added profile fields; only the old untouched height placeholder is upgraded, preserving other edits.

Panel rear = slat thickness + chosen panel rear gap. Panel front adds the white slab thickness. TV rear adds the chosen rear gap; its envelope then adds body depth. The source slat thickness is 0.47 inches (11.938 mm). The panel rear-gap interpretation is explicit in the UI.

TV, soundbar and panel track TV center height. The TV and console stay centered on the wall; the flat panel stays centered on the TV. The console rests on the floor with an editable rear gap. Soundbar orientation swaps bare housing height/depth; a provisional forward offset keeps the initial bar clear of the white slab. The default TV-to-soundbar gap is 0.25 inches. `ResolveCradle` generates twin arms attached to the TV-side mount rails, shelves and front lips; the cradle moves with the TV. Its material thickness and reach remain provisional. A derived annotation measures TV bottom to cradle bottom, including the gap, soundbar height and cradle thickness.

`ResolvePanelSupports` creates four perimeter spacers and two internal mount spacers, initially 16 inches on center. Every spacer bears on drywall and ends flush with the flat panel rear; matching slat cutouts clear the ribs. The mount wall plate bears on the front of the continuous flat panel. Its only initial opening is for the upper electrical plates. Schematic lag guides pass through panel, mount spacers and drywall into blocking; findings flag paths that miss blocking or the mount envelope. These guides are not measured hole locations or a fastener schedule. Blocking occupies the gaps between entered studs. Upper electrical plates center on the mount and stay 2 inches below its bottom edge; lower box height and horizontal offset remain independent. Boxes and power/low-voltage paths remain schematic. Legacy saved opening and independent upper-height fields are retired when loading.

## View behavior

A fitted orthographic camera provides front, right-side and equal-axis isometric projections. There are no mouse camera or drag-placement controls. The same camera instance drives canvas and annotations. Inspection hides TV/soundbar/cradle and the console, then panel and bracket, slats, then drywall. The console is shown only in Finished; no separate console toggle is needed. Perimeter and mount spacers are visible behind the panel, with lag guides through the depth stack. View state does not alter project data or persist with project saves.

## Verification

Model, controller, persistence, projection and view-state tests exercise the public interfaces. Browser checks cover rendering, camera/layer selection, dimension-to-input focus and local save/load. Visual refinements are expected during user testing. Keep future changes localized to these modules rather than adding rules to the workspace root.
