# Architecture — milestone1

## Data flow

```text
React input → DesignerController.setDistance(id, millimeters)
                       ↓
                ResolveAssembly(project)
                       ↓
          DesignerStore publishes one immutable snapshot
                       ↓
           UseDesigner / useSyncExternalStore → React views
```

The store provides only `getSnapshot()` and `subscribe(listener)` to readers. Snapshots retain identity between changes and are deeply frozen. The controller owns publication, rejects nonfinite/out-of-range distances and computes the entire result before notifying. Each workspace gets its own controller at composition time; React context distributes it without a global store singleton.

`setDistance` throws a RangeError on invalid numeric values and publishes nothing. Valid identical values are no-ops. Changes preserve source/uncertainty metadata and do not imply measurement confirmation. Numeric inputs keep temporary invalid text local to React; domain state receives only valid numbers.

## Modules

- `products`: generic part dimensions in millimeters, evidence classifications and preliminary appearance profiles. No React. Source identifiers resolve to local-only research in `.tmp/`; vendor names, model identifiers, shopping URLs and prices never enter tracked data or the deployed bundle.
- `designer`: project inputs, vanilla controller/store, thin React subscription adapter, workspace composition and temporary diagnostic UI.
- `geometry`: pure resolution from Project to Assembly; no React, subscriptions or DOM.
- `shared/Units.ts`: inch/mm conversion and display formatting.
- `app`: root composition and styles. App only supplies the controller and mounts the workspace.

Keep future feature logic beside its feature: viewer presets and inspection actions in the viewer module, drawer selection behavior in the designer/editor interaction module. Extract shared primitives when multiple concrete callers require them. No router is needed for one workspace.

## Spatial conventions

X starts at the wall's left edge. Y starts at finished floor. Z=0 is the front face of existing drywall; positive Z points into the room. Each part has an origin at its minimum X/Y/Z and positive width/height/depth.

Initial assembly: framing zone → drywall →0.47-inch slats →1.5-inch rear-panel gap →19 mm MDF →1-inch provisional TV rear gap →2.2-inch TV envelope. Values are sourced or explicitly provisional. The panel-rear gap convention needs user confirmation: the handoff's projection language was ambiguous.

TV, panel, soundbar and console are horizontally centered for this milestone. Panel center tracks TV center. The soundbar tracks TV bottom with an editable project gap and is assumed flat with its front aligned to the TV front. Console rests on the floor. These relationships are initial implementation choices, not a final constraint system. Front alignment currently causes a soundbar/panel envelope conflict, which the resolver explicitly flags; validate the real cradle before installation planning. This targeted envelope check is not a complete collision or articulation solver.

Parts are dimensional envelopes, not detailed manufacturing contours. Framing is a volume, not an invented stud layout. Mount geometry, spacers, cutouts, blocking and electrical placements remain unresolved. All resolved placements are marked provisional. No fastener coordinates are produced.

Product changes can be supplied through the initial Project without altering resolver code; a product-edit action will be added when the UI needs it. Save serialization/version migration are deferred to milestone5, not implied by schemaVersion1 alone.

## Review checkpoint

Before milestone2, review: Project vs Assembly shape; panel gap convention; source representation; initial soundbar alignment; controller/store interface. Next milestone adds product-specific drawing modules consuming Assembly geometry and catalog appearance. Preset projections and inspection levels will reuse this same assembly, not duplicate placement calculations.
