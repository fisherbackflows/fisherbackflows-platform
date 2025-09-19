interface RegisterLayoutProps {
  children: React.ReactNode;
}

export default function RegisterLayout({ children }: RegisterLayoutProps) {
  // No authentication checks for register page
  return (
    <div className="min-h-screen bg-black">
      <main>
        {children}
      </main>
    </div>
  );
}