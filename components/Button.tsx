import Link from "next/link";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary";

/** Keyed by Variant so a new variant is a compile error until it's styled. */
const VARIANT_CLASS: Record<Variant, string | undefined> = {
  primary: undefined,
  secondary: styles.secondary,
};

interface ButtonStyleProps {
  variant?: Variant;
  /** Stretch to the full width of the container. */
  block?: boolean;
}

function buttonClass(
  { variant = "primary", block }: ButtonStyleProps,
  className?: string,
) {
  return [styles.btn, VARIANT_CLASS[variant], block && styles.block, className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  block,
  className,
  ...rest
}: React.ComponentProps<"button"> & ButtonStyleProps) {
  // Defaults to "button" so a Button inside a form can't submit by accident.
  return (
    <button
      type="button"
      className={buttonClass({ variant, block }, className)}
      {...rest}
    />
  );
}

/** Same look as Button, but navigates. */
export function ButtonLink({
  variant,
  block,
  className,
  ...rest
}: React.ComponentProps<typeof Link> & ButtonStyleProps) {
  return (
    <Link className={buttonClass({ variant, block }, className)} {...rest} />
  );
}
