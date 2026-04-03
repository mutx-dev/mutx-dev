import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ReactNode } from "react";

const components = {
  h1: ({ children, ...props }: { children?: ReactNode }) => (
    <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: { children?: ReactNode }) => (
    <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-3 pb-2 border-b border-gray-100" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: { children?: ReactNode }) => (
    <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-2" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: { children?: ReactNode }) => (
    <h4 className="text-base font-semibold text-gray-900 mt-6 mb-2" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: { children?: ReactNode }) => (
    <p className="text-gray-700 leading-relaxed my-4" {...props}>
      {children}
    </p>
  ),
  a: ({ href, children, ...props }: { href?: string; children?: ReactNode }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-blue-600 hover:text-blue-700 underline underline-offset-2 decoration-blue-200 hover:decoration-blue-400 transition-colors"
        {...props}
      >
        {children}
        {isExternal && (
          <svg className="inline ml-1 mb-0.5" width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M3.5 2.5H2a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-1.5M7 1.5h3.5v3.5M10.5 1.5 5.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </a>
    );
  },
  ul: ({ children, ...props }: { children?: ReactNode }) => (
    <ul className="list-disc pl-6 my-4 space-y-1.5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: { children?: ReactNode }) => (
    <ol className="list-decimal pl-6 my-4 space-y-1.5" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: { children?: ReactNode }) => (
    <li className="text-gray-700 leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: { children?: ReactNode }) => (
    <blockquote
      className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-3 my-4 rounded-r-lg text-gray-700 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }: { children?: ReactNode; className?: string }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto text-sm leading-relaxed border border-gray-800">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: { children?: ReactNode }) => (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto text-sm leading-relaxed border border-gray-800" {...props}>
      {children}
    </pre>
  ),
  table: ({ children, ...props }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: { children?: ReactNode }) => (
    <thead className="bg-gray-50" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: { children?: ReactNode }) => (
    <tbody className="divide-y divide-gray-100" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: { children?: ReactNode }) => (
    <tr className="hover:bg-gray-50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: { children?: ReactNode }) => (
    <th className="text-left px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: { children?: ReactNode }) => (
    <td className="px-4 py-2.5 text-gray-700" {...props}>
      {children}
    </td>
  ),
  hr: () => <hr className="my-8 border-gray-200" />,
  strong: ({ children, ...props }: { children?: ReactNode }) => (
    <strong className="font-semibold text-gray-900" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: { children?: ReactNode }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
};

interface DocsRendererProps {
  source: string;
}

export async function DocsRenderer({ source }: DocsRendererProps) {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });
  return <article className="docs-prose">{content}</article>;
}
