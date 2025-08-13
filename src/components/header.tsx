import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApprovalForm } from '@/components/approval-form';
import { ModeToggle } from '@/components/mode-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parameters } from '@/lib/parameters';

export function Header() {
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

  const userInfo = currentUserEmail && (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ユーザー情報</CardTitle>
      </CardHeader>
      <CardContent>
        <p>現在ログイン中のユーザー:</p>
        <p className="font-bold text-lg">{currentUserEmail}</p>
      </CardContent>
    </Card>
  );

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) pb-2 mb-6">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <h1 className="text-3xl font-bold">稟議ワークフローアプリ</h1>
        <div className="ml-auto">
          <ApprovalForm />
        </div>
        <div>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
