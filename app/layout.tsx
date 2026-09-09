import type { Metadata, Viewport } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

export const metadata: Metadata = {
  title: "Finance AI",
  description:
    "A personal finance management platform that tracks transactions, provides financial analytics, and generates AI-powered insights.",
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
