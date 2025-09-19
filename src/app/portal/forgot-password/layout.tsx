interface ForgotPasswordLayoutProps {
  children: React.ReactNode;
}

export default function ForgotPasswordLayout({ children }: ForgotPasswordLayoutProps) {
  // No authentication checks for forgot password page
  return (
    <div className="min-h-screen bg-black">
      <main>
        {children}
      </main>
    </div>
  );
}