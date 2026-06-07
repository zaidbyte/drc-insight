import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'/>"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#ffffff",
          minHeight: "100vh",
          width: "100vw",
        }}
      >
        {children}
      </body>
    </html>
  );
}
