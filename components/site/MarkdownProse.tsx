import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import styles from "@/components/site/marketing/MarketingProse.module.css";

interface MarkdownProseProps {
  content: string;
  className?: string;
}

/**
 * Renders processed markdown as HTML inside a styled prose panel.
 * Uses remark-rehype -> rehype-stringify to emit actual HTML elements,
 * then styles them with MarketingProse CSS module rules.
 */
export async function MarkdownProse({ content, className }: MarkdownProseProps) {
  const html = String(
    await remark()
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(content)
  );

  return (
    <div
      className={`${styles.prosePanel} ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
