import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "CleanAir App",
  description: "Air quality forecast using NASA TEMPO + ground data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div style={{ paddingTop: "60px" }}>{children}</div>
      </body>
    </html>
  );
}
