import type { VariantProps } from 'class-variance-authority';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { parameters } from '@/lib/parameters';
import { serverScripts } from '@/lib/server';
import type { ApprovalRequest } from '~/types/approval';

export function ApprovalList() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 稟議一覧とユーザー情報を取得
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const allRequests = await serverScripts.getApprovalRequests();
      setRequests(allRequests);

      setCurrentUserEmail(parameters.userAddress);
    } catch (error) {
      toast.error('データ取得エラー', {
        description: `稟議データの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
      console.error('GASエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only fetch on mount
  useEffect(() => {
    fetchRequests();
  }, []);

  // ステータス更新処理
  const handleUpdateStatus = async (
    id: string,
    status: 'approved' | 'rejected',
  ) => {
    try {
      await serverScripts.updateApprovalStatus(id, status);
      toast.success('更新成功', {
        description: `稟議のステータスが${status === 'approved' ? '承認' : '却下'}されました。`,
      });
      fetchRequests(); // データを再取得して画面を更新
    } catch (error) {
      toast.success('更新失敗', {
        description: `ステータス更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
      console.error('GASエラー:', error);
    }
  };

  const getStatusBadgeVariant = (
    status: ApprovalRequest['status'],
  ): VariantProps<typeof badgeVariants>['variant'] => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      // include case 'pending':
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <p>ロード中...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>稟議一覧</CardTitle>
        <CardDescription>
          自分が承認者として指定された稟議を、承認または却下できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p>表示する稟議申請はありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead>申請者</TableHead>
                  <TableHead>承認者</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>申請日時</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{request.applicant}</TableCell>
                    <TableCell>{request.approver}</TableCell>
                    <TableCell>¥{request.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status === 'pending' && '未承認'}
                        {request.status === 'approved' && '承認済み'}
                        {request.status === 'rejected' && '却下済み'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {/* 承認ボタンの表示条件: ステータスがpendingかつ、承認者として自分が指定されている場合 */}
                      {request.status === 'pending' &&
                        request.approver === currentUserEmail && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(request.id, 'approved')
                              }
                            >
                              承認
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(request.id, 'rejected')
                              }
                            >
                              却下
                            </Button>
                          </>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
