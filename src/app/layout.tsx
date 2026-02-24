import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@/styles/globals.scss";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReefBuilder",
  description: "Build your reef tank, track your corals, connect with the community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
