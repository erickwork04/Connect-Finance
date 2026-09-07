import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <html lang="en" className="dark">
      <body className={`${mulish.className} dark antialiased`}>
        {hasClerkKey ? (
          <ClerkProvider
            appearance={{
              baseTheme: dark,
            }}
          >
            <div className="flex h-full flex-col overflow-y-auto">{children}</div>
          </ClerkProvider>
        ) : (
          <div className="flex h-full flex-col overflow-y-auto">{children}</div>
        )}
        <Toaster />
      </body>
    </html>
  );
}
