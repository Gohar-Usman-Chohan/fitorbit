'use client';

import { useEffect } from 'react';

export default function TrainerChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const previousOverflow = main.style.overflow;
    main.style.overflow = 'hidden';

    return () => {
      main.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden sm:-mx-6 sm:-mt-6 sm:h-[calc(100dvh-72px)]">
      {children}
    </div>
  );
}
