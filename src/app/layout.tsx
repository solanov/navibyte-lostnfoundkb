import type { Metadata } from "next";
import "./globals.css";

import { NotificationProvider } from "@/src/context/NotificationContext";
import { NotificationInboxProvider } from "@/src/context/NotificationInboxContext";
import ToastContainer from "@/src/components/ui/ToastContainer";

export const metadata: Metadata = {
  title: "New Era University Knowledge Board",
  description: "Navibyte Lost & Found Knowledge Board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#EEEEEE] font-body">
        <NotificationProvider>
          <NotificationInboxProvider>
            {children}
            <ToastContainer />
          </NotificationInboxProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
