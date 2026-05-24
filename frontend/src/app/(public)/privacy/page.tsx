import Link from 'next/link';
import { PublicPageLayout } from '@/components/features/public/PublicPageLayout';
import { PRIVACY_SECTIONS, SUPPORT_EMAIL } from '@/content/siteContent';

export default function PrivacyPage() {
  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="How FitOrbit collects, uses, and protects your personal information."
    >
      <p className="mb-8 text-sm text-slate-500">Last updated: May 2026</p>

      <div className="space-y-8">
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-8 text-sm text-slate-600">
        Questions? Contact{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-blue-600 hover:text-blue-700">
          {SUPPORT_EMAIL}
        </a>{' '}
        or read our{' '}
        <Link href="/terms" className="font-semibold text-blue-600 hover:text-blue-700">
          Terms & Conditions
        </Link>
        .
      </p>
    </PublicPageLayout>
  );
}
