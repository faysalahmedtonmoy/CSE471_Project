// REMOVE THE IMPORT LINE HERE
export const metadata = {
  title: "AshePashe",
  description: "Find nearby services instantly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children} 
      </body>
    </html>
  );
}