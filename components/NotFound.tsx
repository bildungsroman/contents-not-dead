import { Panel } from "./Panel";
import { ButtonLink } from "./Button";

export function NotFound() {
  return (
    <Panel>
      <h2 style={{ marginTop: 0 }}>Not found</h2>
      <p>This post doesn&rsquo;t exist.</p>
      <ButtonLink href="/">Back home</ButtonLink>
    </Panel>
  );
}
