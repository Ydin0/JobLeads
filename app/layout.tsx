import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const halenoir = localFont({
  src: [
    {
      path: '../public/fonts/Halenoir-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Halenoir-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Halenoir-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Halenoir-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Halenoir-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/Halenoir-ExtraBold.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/Halenoir-RegularItalic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/Halenoir-MediumItalic.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../public/fonts/Halenoir-BoldItalic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-halenoir',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "RecLead - Turn Job Postings Into Warm Leads",
  description: "Scrape jobs from LinkedIn, Indeed, Naukri and more. Enrich with contact data. Push to your CRM. Automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#ffffff",
          colorBackground: "#0a0a0f",
          colorInputBackground: "rgba(255, 255, 255, 0.05)",
          colorInputText: "#ffffff",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${halenoir.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
