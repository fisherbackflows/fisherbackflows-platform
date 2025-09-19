interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  // Auth handled by middleware - no client-side checks needed
  return (
    <div className="min-h-screen bg-black">
      <main>
        {children}
      </main>
    </div>
  );
}