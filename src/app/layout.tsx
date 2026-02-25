import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@neondatabase/auth/ui/css";
import "@/styles/globals.scss";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { AuthProvider } from "./auth-provider";
import { theme } from "./theme";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReefBuilder",
  description: "Build your reef tank, track your corals, connect with the community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <AuthProvider>{children}</AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
