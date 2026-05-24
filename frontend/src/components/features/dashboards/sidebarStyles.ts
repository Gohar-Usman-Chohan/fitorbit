/** Shared layout classes for role dashboard sidebars (below sticky header). */
export const SIDEBAR_MOBILE_CLASSES =
  'fixed left-0 top-16 h-[calc(100vh-4rem)] w-[min(100vw-2rem,16rem)] max-w-[85vw] border-r border-slate-200/80 bg-white transform transition-transform duration-300 z-30 sm:top-[72px] sm:h-[calc(100vh-72px)] sm:w-64';

export const SIDEBAR_DESKTOP_CLASSES =
  'md:relative md:top-auto md:h-auto md:min-h-full md:translate-x-0 md:sticky md:top-0 md:self-start md:max-h-[calc(100vh-72px)] md:overflow-y-auto md:shrink-0';

export const SIDEBAR_FAB_CLASSES =
  'md:hidden fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95';
