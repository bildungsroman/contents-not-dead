import styles from "./Panel.module.css";

/** Bordered callout box. Carries the global `prose` class because every panel
 * holds body copy, and `prose` is what sets the readable measure. */
export function Panel({ className, ...rest }: React.ComponentProps<"div">) {
  return (
    <div
      className={[styles.panel, "prose", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
