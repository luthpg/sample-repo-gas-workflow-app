import { FileTextIcon, LayoutDashboardIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ApprovalRequest } from '@/../types/approval';
import { ThemeProvider } from '@/components/theme-provider';
import {
  embeddedParameters,
  handleOnChangePage,
} from '@/lib/server';
import { Button } from '@/components/ui/button';
import type { Page } from '@/../types/index';
import Dashboard from '@/page/dashboard';

function App() {
  const [submittedRequests, setSubmittedRequests] = useState<ApprovalRequest[]>(
    [],
  );
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [page, setPage] = useState<Page>('dashboard');

  interface PageConfig {
    label: string;
    icon: React.ReactNode;
    component: React.ReactNode;
  }

  const pages: Record<Page, PageConfig> = {
    dashboard: {
      label: 'ダッシュボード',
      icon: <LayoutDashboardIcon />,
      component: <Dashboard />,
    },
    'approval-detail': {
      label: 'ダッシュボード',
      icon: <LayoutDashboardIcon />,
      component: <Dashboard />,
    },
  };

  useEffect(() => {
    setCurrentUserEmail(embeddedParameters.userAddress);
    setPage(embeddedParameters.parameter.page as Page);
  }, []);

  useEffect(() => {
    handleOnChangePage(page);
  }, [page]);

  const handleApprovalFormSubmit = (newRequest: ApprovalRequest) => {
    setSubmittedRequests((prev) => [...prev, newRequest]);
    alert('稟議申請が送信されました！'); // 簡易的な通知
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex h-screen w-full bg-background font-sans">
        {/* サイドバー */}
        <aside className="w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar p-6">
          <div className="flex items-center gap-2 mb-8">
            <FileTextIcon className="h-6 w-6 text-sidebar-foreground" />
            <h1 className="text-lg font-semibold text-sidebar-foreground">
              稟議管理システム
            </h1>
          </div>
          <nav className="flex flex-col space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
              ナビゲーション
            </h2>
            <a
              href="#"
              className="rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground"
            >
              新規申請
            </a>
            <a
              href="#"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              現在の申請
            </a>
            <a
              href="#"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              承認待ち
            </a>
          </nav>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 flex flex-col">
          {/* ヘッダー */}
          <header className="flex items-center justify-end gap-4 border-b border-border p-4">
            <Button variant="outline">ダッシュボード</Button>
            <Button>申請</Button>
            <Button>承認</Button>
          </header>

          {pages[page].component}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
