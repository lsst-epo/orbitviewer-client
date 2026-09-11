/**
 * Cache tags used by fetch calls and invalidated by /api/revalidate.
 * Keyed by the Craft section handle that the webhook reports.
 */
const tagStore = {
  globals: "globals",
  pages: "pages",
  elements: "elements",
  categories: "categories",
  tours: "guidedExperiencesTours",
  dataFiles: "mpcDataFiles",
};

export default tagStore;
