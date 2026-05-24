import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/components/providers/RootProvider";
import { AppShell } from "@/components/layout/AppShell";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  icons: {
    icon: "/logo.svg",
  },
  title: "FitOrbit - Connect with Fitness Experts",
  description: "Connect with certified personal trainers and nutritionists. Get personalized fitness guidance, diet plans, and track your progress on FitOrbit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-montserrat antialiased`}>
        <RootProvider>
          <AppShell>{children}</AppShell>
        </RootProvider>
      </body>
    </html>
  );
}
