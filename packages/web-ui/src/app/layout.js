import { Providers } from './providers';
export const metadata = {
  title: "Sam's HTTP Client",
  description: 'A versatile, pluggable HTTP client application',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
