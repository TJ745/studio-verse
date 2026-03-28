// src/app/(marketing)/layout.tsx
// Marketing layout — no sidebar, no app shell

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
