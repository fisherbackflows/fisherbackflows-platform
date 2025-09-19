interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  // No authentication checks for login page
  return (
    <div className="min-h-screen bg-black">
      <main>
        {children}
      </main>
    </div>
  );
}