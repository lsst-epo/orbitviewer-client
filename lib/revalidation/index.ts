"server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { languages } from "@/lib/i18n/settings";
import { getPathname } from "@/lib/i18n/navigation";
import tagStore from "@/lib/api/tags";

const CRAFT_HOMEPAGE_URI = "__home__";

/** Next.js 16 requires a cacheLife profile; "max" expires the entry. */
const REVALIDATE_PROFILE = "max";

/** Maps a Craft URI to the routes that render it, for every locale. */
const revalidate = (uri: string) => {
  const paths: Array<string> = [];
  const tags = new Set<string>();

  const segments = uri === CRAFT_HOMEPAGE_URI ? [] : uri.split("/");
  const section = segments.find((part) => part.length > 0);

  languages.forEach((locale) => {
    const path = getPathname({
      href: { pathname: `/${segments.join("/")}` },
      locale,
    });

    paths.push(path);
    revalidatePath(path);
  });

  const sectionTag = section
    ? tagStore[section as keyof typeof tagStore]
    : undefined;

  if (sectionTag) {
    tags.add(sectionTag);
    revalidateTag(sectionTag, REVALIDATE_PROFILE);
  }

  tags.add(tagStore.globals);
  revalidateTag(tagStore.globals, REVALIDATE_PROFILE);

  return { paths, tags: [...tags] };
};

export default revalidate;
