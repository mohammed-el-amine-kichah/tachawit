// A small, safe Markdown subset for culture articles, parsed into a tree that React renders as
// elements. There is no HTML output at all: raw HTML stays text, and only http(s), mailto and
// relative links, and https or storage images, are kept.

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong" | "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "heading"; level: 2 | 3; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; children: Inline[] }
  | { type: "image"; src: string; alt: string };

const SAFE_LINK = /^(https?:\/\/|mailto:|\/(?!\/))/i;
const SAFE_IMAGE = /^(https:\/\/|(?![a-z][a-z0-9+.-]*:)(?!\/\/)[\w./-]+$)/i;

const PATTERNS = [
  { type: "strong", regex: /\*\*(.+?)\*\*/ },
  { type: "link", regex: /\[([^\]]+)\]\(([^)\s]+)\)/ },
  { type: "em", regex: /\*([^*\s][^*]*)\*/ },
  { type: "em", regex: /_([^_\s][^_]*)_/ },
] as const;

function pushText(out: Inline[], text: string) {
  if (!text) return;
  const last = out.at(-1);
  if (last?.type === "text") last.text += text;
  else out.push({ type: "text", text });
}

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let rest = source;
  while (rest) {
    let best: { index: number; match: RegExpExecArray; type: (typeof PATTERNS)[number]["type"] } | null = null;
    for (const { type, regex } of PATTERNS) {
      const match = regex.exec(rest);
      if (match && (!best || match.index < best.index)) best = { index: match.index, match, type };
    }
    if (!best) {
      pushText(out, rest);
      break;
    }
    pushText(out, rest.slice(0, best.index));
    const [whole, inner, href] = best.match;
    if (best.type === "link") {
      if (SAFE_LINK.test(href)) out.push({ type: "link", href, children: parseInline(inner) });
      else
        for (const node of parseInline(inner)) {
          if (node.type === "text") pushText(out, node.text);
          else out.push(node);
        }
    } else {
      out.push({ type: best.type, children: parseInline(inner) });
    }
    rest = rest.slice(best.index + whole.length);
  }
  return out;
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
    if (quote.length) blocks.push({ type: "quote", children: parseInline(quote.join(" ")) });
    if (list) blocks.push({ type: "list", ordered: list.ordered, items: list.items.map(parseInline) });
    paragraph = [];
    quote = [];
    list = null;
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line);
    const quoted = /^>\s?(.*)$/.exec(line);
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line);

    if (!line) flush();
    else if (heading) {
      flush();
      blocks.push({ type: "heading", level: heading[1].length === 3 ? 3 : 2, children: parseInline(heading[2]) });
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (paragraph.length || quote.length || (list && list.ordered !== ordered)) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else if (quoted) {
      if (paragraph.length || list) flush();
      quote.push(quoted[1]);
    } else if (image && SAFE_IMAGE.test(image[2])) {
      flush();
      blocks.push({ type: "image", src: image[2], alt: image[1] });
    } else {
      if (quote.length || list) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
