import { SITE } from "@/lib/config";
import { buttonClass } from "./Button";
import { ExternalLink } from "./ExternalLink";
import { Logo } from "./Logo";
import styles from "./Hero.module.css";

/** Homepage masthead. `data-hero` lets the header hide its home icon, and the
 * maximalist theme skip its content panel, while the hero is on the page. */
export function Hero() {
  return (
    <section className={styles.hero} data-hero>
      <Logo className={styles.logo} />
      <h1 className={styles.title}>{SITE.name.replace("'", "\u2019")}</h1>
      <p className={styles.subtitle}>{SITE.description}</p>
      <ExternalLink href={`${SITE.repo}/fork`} className={buttonClass({})}>
        Fork repo
      </ExternalLink>
    </section>
  );
}
