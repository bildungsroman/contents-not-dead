import styles from "./ExternalLink.module.css";

/** Link to another site, opened in a new tab. */
export function ExternalLink({
  children,
  ...rest
}: Omit<React.ComponentProps<"a">, "target" | "rel">) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <span className={styles.srOnly}>(opens in a new tab)</span>
    </a>
  );
}
