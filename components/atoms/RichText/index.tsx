import sanitizeHtml from "sanitize-html";
export function RichText({
  html,
  inline = false,
}: {
  html?: string | null;
  inline?: boolean;
}) {
  if (!html) return null;
  const clean = sanitizeHtml(html, {
    allowedTags: inline
      ? ["br", "strong", "em", "span"]
      : [...sanitizeHtml.defaults.allowedTags, "img"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height", "loading"],
    },
  });
  const Tag = inline ? "span" : "div";
  return <Tag dangerouslySetInnerHTML={{ __html: clean }} />;
}
