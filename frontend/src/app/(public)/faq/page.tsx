import Link from 'next/link';
import { PublicCtaCard, PublicPageLayout } from '@/components/features/public/PublicPageLayout';
import { FaqAccordion } from '@/components/features/public/FaqAccordion';
import { FAQ_ITEMS, SUPPORT_EMAIL } from '@/content/siteContent';

export default function FaqPage() {
  return (
    <PublicPageLayout
      title="Frequently Asked Questions"
      subtitle="Answers to common questions about accounts, experts, bookings, and support on FitOrbit."
    >
      <FaqAccordion items={FAQ_ITEMS} />

      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Still need help?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Visit our{' '}
          <Link href="/contact" className="font-semibold text-blue-600 hover:text-blue-700">
            Contact Us
          </Link>{' '}
          page or email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-blue-600 hover:text-blue-700">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>

      <PublicCtaCard />
    </PublicPageLayout>
  );
}
