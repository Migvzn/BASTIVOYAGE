import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BastiVoyage — IA Travel Planner",
  description:
    "Planifiez votre voyage en quelques secondes avec une IA qui optimise budget, transport, hôtels et itinéraire.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
