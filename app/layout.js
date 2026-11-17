import "./globals.css";

export const metadata = {
  title: "Nexivious | Digital products, thoughtfully engineered",
  description:
    "Nexivious is a Noida-based software company building custom web applications, mobile apps, and digital products for ambitious businesses.",
  applicationName: "Nexivious",
  keywords: [
    "Nexivious",
    "software company Noida",
    "web development",
    "mobile app development",
    "custom software",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
