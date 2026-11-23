import type { Metadata } from 'next';
import { language } from '@/lib/i18n-server';
import './globals.css';

export const metadata: Metadata = {
  title: 'DARIYA — Your home in Morocco',
  description: 'Property care, maintenance, inspections and rental tracking for Moroccans abroad.'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await language();
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function scrub() {
                  var els = document.querySelectorAll('[bis_skin_checked]');
                  for (var i = 0; i < els.length; i++) {
                    els[i].removeAttribute('bis_skin_checked');
                  }
                }
                scrub();
                if (typeof MutationObserver !== 'undefined') {
                  new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.attributeName === 'bis_skin_checked' && m.target && m.target.removeAttribute) {
                        m.target.removeAttribute('bis_skin_checked');
                      }
                    }
                  }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked'] });
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
