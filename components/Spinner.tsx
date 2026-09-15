import styles from "./Spinner.module.css";

type Size = "small" | "large";

/** Keyed by Size so a new size is a compile error until it's styled. */
const SIZE_CLASS: Record<Size, string | undefined> = {
  small: undefined,
  large: styles.large,
};

/** Loading indicator. Announces itself because it often replaces a button's
 * label, which would otherwise leave the button with no accessible name. */
export function Spinner({
  label = "Loading",
  size = "small",
}: {
  label?: string;
  size?: Size;
}) {
  return (
    <span
      className={[styles.spinner, SIZE_CLASS[size]].filter(Boolean).join(" ")}
      role="status"
      aria-label={label}
    />
  );
}
