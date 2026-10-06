import { SITE } from "@/lib/config";
import { Logo } from "./Logo";
import styles from "./Hero.module.css";

/** Homepage masthead. `data-hero` lets the header drop its own branding
 * (title, or the maximalist home icon) while the hero is on the page. */
export function Hero() {
  return (
    <section className={styles.hero} data-hero>
      <Logo className={styles.logo} />
      <h1 className={styles.title}>{SITE.name.replace("'", "\u2019")}</h1>
      <p className={styles.subtitle}>{SITE.description}</p>
    </section>
  );
}
