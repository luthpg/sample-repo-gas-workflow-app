import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApprovalForm } from '@/components/approval-form';
import { ApprovalList } from '@/components/approval-list';
import { ModeToggle } from '@/components/mode-toggle';
import { ThemeProvider } from '@/components/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { parameters } from '@/lib/parameters';

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // ユーザー情報を取得
    const fetchUserEmail = async () => {
      try {
        setCurrentUserEmail(parameters.userAddress);
      } catch (error) {
        toast.error('ユーザー情報取得エラー', {
          description: `ユーザーメールアドレスの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        });
        console.error('GASエラー:', error);
      }
    };
    fetchUserEmail();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <main className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">稟議ワークフローアプリ</h1>
          <ModeToggle />
        </div>

        {currentUserEmail && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>ユーザー情報</CardTitle>
            </CardHeader>
            <CardContent>
              <p>現在ログイン中のユーザー:</p>
              <p className="font-bold text-lg">{currentUserEmail}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <ApprovalForm />
        </div>

        <ApprovalList />
      </main>
      <Toaster />
    </ThemeProvider>
  );
}
