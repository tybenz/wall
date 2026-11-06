import { editorGroups } from "../designer/DistanceDefinitions";
import {
  verificationItems,
  type VerificationBucket,
} from "../designer/FieldCatalog";
import type { Project } from "../designer/DesignerTypes";
import type { ViewController } from "../viewer/ViewStore";
const buckets: readonly VerificationBucket[] = [
  "Site measurements",
  "Part & material dimensions",
  "Hardware details",
];
export function VerificationList({
  project,
  view,
}: {
  project: Project;
  view: ViewController;
}) {
  const items = verificationItems(project);
  return (
    <>
      <p className="verification-intro">
        {items.length
          ? `${items.length} physical facts still need verification. Each item opens its normal location.`
          : "All physical facts have been verified."}{" "}
        Layout choices are excluded.
      </p>
      {buckets.map((bucket) => {
        const matches = items.filter((i) => i.bucket === bucket);
        return matches.length ? (
          <section className="editor-section" key={bucket}>
            <h3>
              {bucket} <span>{matches.length}</span>
            </h3>
            <ul className="verification-list">
              {matches.map((item) => (
                <li key={item.field}>
                  <button
                    onClick={() => view.openEditor(item.group, item.field)}
                  >
                    <span>{item.label}</span>
                    <small>
                      {editorGroups.find((g) => g.id === item.group)?.label}
                    </small>
                    <span aria-hidden="true">↗</span>
                  </button>
                  <p>{item.note}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      })}
    </>
  );
}
