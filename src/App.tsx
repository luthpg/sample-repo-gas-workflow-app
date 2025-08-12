import { ApprovalList } from '@/components/approval-list';
import { Header } from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <main className="container mx-auto py-6 px-4 space-y-8">
        <Header />
        <ApprovalList />
      </main>
      <Toaster />
    </ThemeProvider>
  );
}
