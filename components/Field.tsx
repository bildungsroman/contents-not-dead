import styles from "./Field.module.css";

/** Labelled form row. The control is passed as children and must carry the
 * same `id`, which is what links it to the label. */
export function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
