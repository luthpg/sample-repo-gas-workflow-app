import { useState } from 'react';
import { ApprovalList } from '@/components/approval-list';
import { Header } from '@/components/header';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  // 申請フォーム送信後の再描画をトリガーするためのstate
  const [refreshKey, setRefreshKey] = useState(0);

  // 現在のテーマを取得
  const { theme } = useTheme();

  // フォームが正常に送信されたときに呼び出され、一覧を更新する
  const handleFormSubmitSuccess = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <main className="container mx-auto space-y-8 px-4 py-6">
        <Header onFormSubmitSuccess={handleFormSubmitSuccess} />
        <ApprovalList key={refreshKey} />
      </main>
      <Toaster theme={theme} />
    </ThemeProvider>
  );
}
