import type { Metadata, Viewport } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

export const metadata = {
  title: "Connect Finance",
  description:
    "Organize suas finanças, acompanhe receitas e despesas e tenha insights inteligentes para tomar melhores decisões.",

  openGraph: {
    title: "Connect Finance",
    description:
      "Organize suas finanças, acompanhe receitas e despesas e tenha insights inteligentes para tomar melhores decisões.",
    url: "https://www.financeconnect.com.br",
    siteName: "Connect Finance",
    images: [
      {
        url: "https://www.financeconnect.com.br/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Connect Finance",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Connect Finance",
    description:
      "Organize suas finanças, acompanhe receitas e despesas e tenha insights inteligentes para tomar melhores decisões.",
    images: ["https://www.financeconnect.com.br/og-image.jpeg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090b",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${mulish.className} dark min-h-screen bg-background text-foreground antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
          }}
        >
          <div className="flex min-h-screen flex-col">{children}</div>
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
