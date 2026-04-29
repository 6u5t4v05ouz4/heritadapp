import { DocsSidebar } from "@/components/docs/Sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      {/* We reuse the main Header from the app or create a specific one. For simplicity, we assume the main layout header is present above this if it's in the standard structure, or we build a layout specific container here. */}
      {/* In Next.js App Router, layout.tsx wraps page.tsx. The main header might be in app/layout.tsx. If so, it will appear automatically. */}
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 flex gap-8">
        <DocsSidebar />
        <main className="flex-1 py-8 md:py-12 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
