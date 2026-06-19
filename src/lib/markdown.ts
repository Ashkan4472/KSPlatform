import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { marked } from "marked";

let turndown: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndown) {
    turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    turndown.use(gfm);
  }
  return turndown;
}

/** Convert editor HTML to Markdown for persistence. */
export function htmlToMarkdown(html: string): string {
  return getTurndown().turndown(html).trim();
}

/** Convert stored Markdown back to HTML for seeding the editor. */
export function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

/** Build a short plain-text excerpt from Markdown content. */
export function excerptFromMarkdown(md: string, maxLength = 180): string {
  const text = md
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/[#>*_`~-]/g, " ") // markdown punctuation
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
