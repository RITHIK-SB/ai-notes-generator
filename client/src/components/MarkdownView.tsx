import ReactMarkdown from 'react-markdown';

/**
 * Safe Markdown rendering: react-markdown parses to a React tree and never
 * renders raw HTML (rehype-raw is not enabled), so AI output cannot inject markup.
 */
export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose-notes max-w-none text-[15px] leading-7 text-gray-800">
      <ReactMarkdown
        components={{
          h1: (p) => <h2 className="mb-3 mt-6 text-xl font-bold text-primary-900" {...p} />,
          h2: (p) => <h3 className="mb-2 mt-6 text-lg font-bold text-primary-900" {...p} />,
          h3: (p) => <h4 className="mb-2 mt-5 text-base font-semibold text-primary-800" {...p} />,
          p: (p) => <p className="mb-3" {...p} />,
          ul: (p) => <ul className="mb-3 list-disc space-y-1 pl-6" {...p} />,
          ol: (p) => <ol className="mb-3 list-decimal space-y-1 pl-6" {...p} />,
          li: (p) => <li className="pl-1" {...p} />,
          strong: (p) => <strong className="font-semibold text-gray-900" {...p} />,
          code: (p) => <code className="rounded bg-gray-100 px-1 py-0.5 text-[13px] text-primary-800" {...p} />,
          blockquote: (p) => (
            <blockquote className="mb-3 border-l-4 border-accent-300 bg-accent-300/10 px-4 py-2 italic text-gray-700" {...p} />
          ),
          hr: () => <hr className="my-6 border-gray-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
