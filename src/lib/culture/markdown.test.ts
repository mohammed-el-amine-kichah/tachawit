import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./markdown";

describe("parseMarkdown", () => {
  it("parses headings, paragraphs and soft line breaks", () => {
    expect(parseMarkdown("## Yennayer\n\nThe Amazigh\nnew year.")).toEqual([
      { type: "heading", level: 2, children: [{ type: "text", text: "Yennayer" }] },
      { type: "paragraph", children: [{ type: "text", text: "The Amazigh new year." }] },
    ]);
  });

  it("parses bold, italic and links inside text", () => {
    expect(parseMarkdown("A **big** *meal* with [family](https://example.org).")).toEqual([
      {
        type: "paragraph",
        children: [
          { type: "text", text: "A " },
          { type: "strong", children: [{ type: "text", text: "big" }] },
          { type: "text", text: " " },
          { type: "em", children: [{ type: "text", text: "meal" }] },
          { type: "text", text: " with " },
          { type: "link", href: "https://example.org", children: [{ type: "text", text: "family" }] },
          { type: "text", text: "." },
        ],
      },
    ]);
  });

  it("parses bullet and numbered lists", () => {
    expect(parseMarkdown("- couscous\n- dates\n\n1. first\n2. second")).toEqual([
      { type: "list", ordered: false, items: [[{ type: "text", text: "couscous" }], [{ type: "text", text: "dates" }]] },
      { type: "list", ordered: true, items: [[{ type: "text", text: "first" }], [{ type: "text", text: "second" }]] },
    ]);
  });

  it("parses quotes and images on their own line", () => {
    expect(parseMarkdown("> Azul!\n\n![Silver fibula](culture/fibula.webp)")).toEqual([
      { type: "quote", children: [{ type: "text", text: "Azul!" }] },
      { type: "image", src: "culture/fibula.webp", alt: "Silver fibula" },
    ]);
  });

  it("never produces unsafe links: javascript and data URLs become plain text", () => {
    const [block] = parseMarkdown("[click](javascript:alert(1)) and [x](data:text/html,hi)");
    expect(JSON.stringify(block)).not.toContain("javascript:");
    expect(JSON.stringify(block)).not.toContain('"type":"link"');
  });

  it("treats raw HTML as text (it is rendered escaped)", () => {
    expect(parseMarkdown("<script>alert(1)</script>")).toEqual([
      { type: "paragraph", children: [{ type: "text", text: "<script>alert(1)</script>" }] },
    ]);
  });

  it("allows only same-site, https or storage-relative image sources", () => {
    expect(parseMarkdown("![a](http://insecure.example/a.png)")[0].type).toBe("paragraph");
    expect(parseMarkdown("![a](https://cdn.example/a.png)")[0]).toEqual({ type: "image", src: "https://cdn.example/a.png", alt: "a" });
  });
});
