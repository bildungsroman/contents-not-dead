import styles from "./Spinner.module.css";

/** Loading indicator. Announces itself because it often replaces a button's
 * label, which would otherwise leave the button with no accessible name. */
export function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className={styles.spinner} role="status" aria-label={label} />;
}
