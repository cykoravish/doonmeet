import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";
import JsonLd from "@/components/seo/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://doonmeet.in"),
  manifest: "/manifest.json",
  applicationName: "DoonMeet",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  title: {
    default: "DoonMeet - Meet People, Events & Communities in Dehradun",
    template: "%s | DoonMeet",
  },
  description:
    "DoonMeet is where Dehradun hangs out online — find events worth showing up for, join communities that match your interests, and chat with people nearby.",
  openGraph: {
    title: "DoonMeet - Meet People, Events & Communities in Dehradun",
    description:
      "Find events worth showing up for, join communities that match your interests, and chat with people nearby — all in one place for Dehradun.",
    url: "https://doonmeet.in",
    siteName: "DoonMeet",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DoonMeet - Meet People, Events & Communities in Dehradun",
    description:
      "Find events worth showing up for, join communities that match your interests, and chat with people nearby — all in one place for Dehradun.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e0c" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://doonmeet.in/#website",
              name: "DoonMeet",
              alternateName: ["Doon Meet", "DoonMeet Dehradun"],
              url: "https://doonmeet.in",
              inLanguage: "en-IN",
              description:
                "A free local community for Dehradun — find events, join communities, discover places and chat with people nearby.",
              publisher: { "@id": "https://doonmeet.in/#organization" },
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://doonmeet.in/#organization",
              name: "DoonMeet",
              url: "https://doonmeet.in",
              logo: "https://doonmeet.in/doonmeet-light.png",
              description:
                "DoonMeet is a local community platform for Dehradun, Uttarakhand — events, communities, places and chat in one place.",
              areaServed: {
                "@type": "City",
                name: "Dehradun",
                containedInPlace: { "@type": "AdministrativeArea", name: "Uttarakhand, India" },
              },
              sameAs: ["https://instagram.com/cykoravish"],
            },
          ]}
        />
        {/* Captures `beforeinstallprompt` the instant it fires, which can
            happen before React hydrates and our own listener (in
            useInstallPrompt) has attached. The event only ever fires once
            per page load and isn't replayed, so without this, a fast fire
            means the "Install App" button never appears — Chrome just
            shows its own default mini-infobar instead. Stashing it on
            `window` lets useInstallPrompt pick it up on mount regardless
            of timing. Intentionally tiny and dependency-free since it runs
            before any app code. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              window.addEventListener("beforeinstallprompt", function (e) {
                e.preventDefault();
                window.__deferredInstallPrompt = e;
                window.dispatchEvent(new Event("pwa-install-ready"));
              });
              window.addEventListener("appinstalled", function () {
                window.__deferredInstallPrompt = null;
              });
            })();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <RegisterServiceWorker />
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
