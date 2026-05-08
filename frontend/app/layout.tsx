import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: {
    default: "RAG AI Assistant",
    template: "%s | RAG AI Assistant",
  },

  description:
    "An intelligent RAG-powered AI assistant for chatting with documents, retrieving knowledge instantly, and enhancing productivity with AI.",

  keywords: [
    "RAG",
    "AI Assistant",
    "Chatbot",
    "Retrieval Augmented Generation",
    "Next.js",
    "Supabase",
    "OpenAI",
    "Document Chat",
    "AI Search",
    "Knowledge Base",
  ],

  authors: [
    {
      name: "Umair Malik",
    },
  ],

  creator: "Umair Malik",

  metadataBase: new URL("https://yourdomain.com"),

  openGraph: {
    title: "RAG AI Assistant",
    description:
      "Chat with your documents using an advanced Retrieval-Augmented Generation AI assistant.",

    url: "https://yourdomain.com",

    siteName: "RAG AI Assistant",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RAG AI Assistant",
      },
    ],

    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "RAG AI Assistant",
    description:
      "AI-powered document chat and knowledge retrieval system built with Next.js and Supabase.",

    images: ["/og-image.png"],

    creator: "@yourhandle",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
