import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleAnalytics } from "@next/third-parties/google";

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
  title: {
    default: "DoonMeet - Meet People, Events & Communities in Dehradun",
    template: "%s | DoonMeet",
  },
  description:
    "Discover local events, join communities, chat with people, and connect with others in Dehradun through DoonMeet.",
  openGraph: {
    title: "DoonMeet - Meet People, Events & Communities in Dehradun",
    description:
      "Discover local events, join communities, chat with people, and connect with others in Dehradun through DoonMeet.",
    url: "https://doonmeet.in",
    siteName: "DoonMeet",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DoonMeet - Meet People, Events & Communities in Dehradun",
    description:
      "Discover local events, join communities, chat with people, and connect with others in Dehradun through DoonMeet.",
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
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "DoonMeet",
              url: "https://doonmeet.in",
              description:
                "Discover local events, join communities, chat with people, and connect with others in Dehradun through DoonMeet.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://doonmeet.in/communities?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "DoonMeet",
              url: "https://doonmeet.in",
              logo: "https://doonmeet.in/doonmeet-light.png",
              sameAs: ["https://instagram.com/cykoravish"],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
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
