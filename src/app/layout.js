
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react"; // ⬅️ Importa SessionProvider
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Biocells Web",
  description: "Creado por Sistemas Biocells",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider> {/* ⬅️ Aquí se envuelve */}
      </body>
    </html>
  );
}
