'use client';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:shadow-md transition"
        >
          <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none">
            <span className="flex items-center justify-between gap-4">
              {item.question}
              <span className="text-blue-600 transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
