"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/core/cn";

// AI 조교·Q&A 답변은 마크다운으로 온다. 원문을 그대로 뿌리면 ##, **, 표 기호가 그대로 보인다.
// react-markdown 은 React 엘리먼트로 렌더링하므로 HTML 을 직접 삽입하지 않는다(XSS 여지 없음).

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-sm leading-relaxed text-ink", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h3 className="mt-4 text-base font-bold text-ink first:mt-0">{children}</h3>,
          h2: ({ children }) => <h4 className="mt-4 text-[15px] font-bold text-ink first:mt-0">{children}</h4>,
          h3: ({ children }) => <h5 className="mt-3 text-sm font-bold text-ink first:mt-0">{children}</h5>,
          p: ({ children }) => <p className="mt-2.5 first:mt-0">{children}</p>,
          ul: ({ children }) => <ul className="mt-2.5 list-disc space-y-1 pl-5 first:mt-0">{children}</ul>,
          ol: ({ children }) => <ol className="mt-2.5 list-decimal space-y-1 pl-5 first:mt-0">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ className: lang, children }) => {
            const isBlock = typeof lang === "string" && lang.startsWith("language-");
            if (isBlock) {
              return (
                <code className="block whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[13px] text-ink">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mt-3 overflow-x-auto rounded-control border border-hairline bg-surface-muted p-3 first:mt-0">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-3 border-l-2 border-cardline pl-3 text-muted first:mt-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-hairline" />,
          // 표는 좁은 화면에서 가로 스크롤로 흘린다 — 본문이 옆으로 밀리지 않게.
          table: ({ children }) => (
            <div className="mt-3 overflow-x-auto first:mt-0">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-muted">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-hairline px-2.5 py-1.5 text-left font-semibold text-ink">{children}</th>
          ),
          td: ({ children }) => <td className="border border-hairline px-2.5 py-1.5 align-top">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
