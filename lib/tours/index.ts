import type {
  getGuidedExperience,
  getGuidedExperiences,
} from "@/lib/api/craft";

/** Tour shapes. Blocks are narrowed on `__typename` -- see README. */

export type TourSummary = NonNullable<
  Awaited<ReturnType<typeof getGuidedExperiences>>[number]
>;
export type Tour = NonNullable<Awaited<ReturnType<typeof getGuidedExperience>>>;
export type Slide = NonNullable<NonNullable<Tour["flexible"]>[number]>;

export type SlideOf<T extends Slide["__typename"]> = Extract<
  Slide,
  { __typename: T }
>;

/**
 * Complexity to a difficulty label key.
 *
 * Thresholds ported verbatim from the legacy `difficulty` Nunjucks filter:
 * under 3 is easy, under 5 medium, otherwise hard.
 */
export const difficultyKey = (complexity?: number | null): string => {
  const value = complexity ?? 0;
  if (value < 3) return "guides.difficulty.easy";
  if (value < 5) return "guides.difficulty.medium";
  return "guides.difficulty.hard";
};

/** Drops the nulls Craft's matrix type allows. */
export const slidesOf = (tour: Tour): Array<Slide> =>
  (tour.flexible ?? []).filter((slide): slide is Slide => slide !== null);

/**
 * The object a slide focuses, if it has one.
 *
 * `closeUp` holds a Craft `elements` entry whose `elementID` is the very id
 * the explorer's `object` param takes, so no second lookup is needed. The
 * legacy slugified it on the way through -- lowercasing and replacing
 * non-alphanumerics -- which is wrong for anything whose id is not already
 * lowercase; see the note on `ExplorerParamsSchema.object`.
 */
export const closeUpId = (slide: Slide): string | undefined => {
  if (slide.__typename !== "defaultSlide_Entry") return undefined;

  const element = slide.closeUp?.[0];

  return element && "elementID" in element
    ? (element.elementID ?? undefined)
    : undefined;
};

/** Every object the tour visits, in slide order and without duplicates. */
export const tourObjectIds = (slides: Array<Slide>): Array<string> => [
  ...new Set(slides.flatMap((slide) => closeUpId(slide) ?? [])),
];

export interface TourSortOption {
  value: string;
  labelKey: string;
}

/**
 * The sort menu, ported from the legacy.
 *
 * The legacy sorted by writing a `--order` custom property onto each card and
 * letting flexbox reorder them, which leaves the DOM order -- and so the tab
 * and screen-reader order -- unchanged and disagreeing with what is on
 * screen. The list is sorted for real here.
 */
export const SORT_OPTIONS: Array<TourSortOption> = [
  { value: "date-desc", labelKey: "guides.index.filter.newer" },
  { value: "date-asc", labelKey: "guides.index.filter.older" },
  { value: "duration-asc", labelKey: "guides.index.filter.less_duration" },
  { value: "duration-desc", labelKey: "guides.index.filter.more_duration" },
  { value: "complexity-asc", labelKey: "guides.index.filter.less_complex" },
  { value: "complexity-desc", labelKey: "guides.index.filter.more_complex" },
];

export const DEFAULT_SORT = SORT_OPTIONS[0].value;

const sortValue = (tour: TourSummary, field: string): number => {
  if (field === "date") return new Date(tour.postDate ?? 0).getTime();
  if (field === "duration") return tour.duration ?? 0;
  if (field === "complexity") return tour.complexity ?? 0;
  return 0;
};

export function sortTours(
  tours: Array<TourSummary>,
  sort: string
): Array<TourSummary> {
  const [field, direction] = sort.split("-");

  return [...tours].sort((a, b) => {
    const delta = sortValue(a, field) - sortValue(b, field);
    return direction === "desc" ? -delta : delta;
  });
}

export const matchesQuery = (tour: TourSummary, query: string): boolean =>
  !query || (tour.title ?? "").toLowerCase().includes(query.toLowerCase());
