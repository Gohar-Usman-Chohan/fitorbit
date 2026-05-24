import Link from 'next/link';
import { PublicPageLayout } from '@/components/features/public/PublicPageLayout';
import { TERMS_SECTIONS, SUPPORT_EMAIL } from '@/content/siteContent';

export default function TermsPage() {
  return (
    <PublicPageLayout
      title="Terms & Conditions"
      subtitle="Rules and guidelines for using the FitOrbit platform."
    >
      <p className="mb-8 text-sm text-slate-500">Last updated: May 2026</p>

      <div className="space-y-8">
        {TERMS_SECTIONS.map((section) => (
          <section key={section.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-8 text-sm text-slate-600">
        See also our{' '}
        <Link href="/privacy" className="font-semibold text-blue-600 hover:text-blue-700">
          Privacy Policy
        </Link>
        . For support, email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-blue-600 hover:text-blue-700">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </PublicPageLayout>
  );
}
