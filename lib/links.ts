import { appUrl } from "@/lib/config";

/** True for absolute http(s) URLs on a different origin than this site. */
export function isExternalHref(href: string | undefined): href is string {
  if (!href || !/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).origin !== new URL(appUrl()).origin;
  } catch {
    return false;
  }
}
