interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Renders schema.org JSON-LD.
 *
 * JSON.stringify does NOT escape "<", so user-written text (post bodies,
 * event descriptions…) containing "</script>" would break out of the tag and
 * run as HTML. Escaping "<" as \u003c keeps the JSON identical for crawlers
 * while making that impossible.
 */
export default function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
