import Link from 'next/link';

interface PublicPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl';
}

const WIDTH = {
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export function PublicPageLayout({
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">FitOrbit</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{subtitle}</p>
          ) : null}
        </div>
      </section>
      <div className={`mx-auto ${WIDTH[maxWidth]} px-4 py-8 sm:px-6 sm:py-10 md:py-12`}>{children}</div>
    </div>
  );
}

export function PublicCtaCard() {
  return (
    <div className="mt-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white shadow-lg">
      <h2 className="text-2xl font-bold">Ready to get started?</h2>
      <p className="mx-auto mt-2 max-w-lg text-blue-100">
        Join FitOrbit and connect with certified trainers and nutritionists today.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/register"
          className="inline-flex rounded-lg bg-white px-6 py-2.5 font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          Sign Up
        </Link>
        <Link
          href="/search"
          className="inline-flex rounded-lg border border-white/40 px-6 py-2.5 font-semibold text-white transition hover:bg-white/10"
        >
          Find Experts
        </Link>
      </div>
    </div>
  );
}
