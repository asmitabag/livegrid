import type { Metadata } from "next";
import "@/styles/globals.css";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: {
    default: "LiveGrid",
    template: "%s · LiveGrid"
  },
  description: "A lightweight real-time collaborative spreadsheet."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}