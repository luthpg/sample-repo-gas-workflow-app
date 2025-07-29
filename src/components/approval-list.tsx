import type React from 'react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { serverScripts } from '@/lib/server'; // serverScripts をインポート
import type {
  ApiResponse,
  ApprovalRequest,
  ApprovalStatus,
} from '../../types/approval';

interface ApprovalListProps {
  initialRequests: ApprovalRequest[];
  isApprover: boolean; // 承認者かどうかを受け取るプロパティを追加
}

const ApprovalList: React.FC<ApprovalListProps> = ({
  initialRequests,
  isApprover,
}) => {
  const [requests, setRequests] = useState<ApprovalRequest[]>(initialRequests);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // ページロード時にGASから最新の稟議リストを取得
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        let response: string;
        try {
          response = await serverScripts.getApprovalRequests();
        } catch (error) {
          console.error('GASエラー:', error);
          setError(
            `稟議リストの取得に失敗しました: ${(error as Error).message}`,
          );
          return;
        }
        const result: ApiResponse<ApprovalRequest[]> = JSON.parse(response);

        if (result.success && result.data) {
          setRequests(result.data);
        } else {
          setError(result.error || '不明なエラーが発生しました');
        }
      } catch (err: any) {
        console.error('フロントエンドエラー:', err);
        setError('稟議リストの取得中に予期せぬエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []); // 初回マウント時のみ実行

  const handleUpdateStatus = async (
    id: string,
    status: ApprovalStatus,
    reason?: string,
  ) => {
    setError(null);
    try {
      let response: string;
      try {
        response = await serverScripts.updateApprovalStatus(id, status, reason);
      } catch (error) {
        console.error('GASエラー:', error);
        setError(`ステータス更新に失敗しました: ${(error as Error).message}`);
        return;
      }
      const result: ApiResponse<ApprovalRequest> = JSON.parse(response);

      if (result.success && result.data) {
        setRequests((prev) =>
          prev.map((req) => (req.id === result.data?.id ? result.data : req)),
        );
        alert(
          `稟議 ${id} が${status === 'approved' ? '承認' : '却下'}されました。`,
        );
      } else {
        setError(result.error || '不明なエラーが発生しました');
      }
    } catch (err: any) {
      console.error('フロントエンドエラー:', err);
      setError('ステータス更新中に予期せぬエラーが発生しました');
    } finally {
      setIsRejectDialogOpen(false);
      setSelectedRequestId(null);
      setRejectionReason('');
    }
  };

  const openRejectDialog = (id: string) => {
    setSelectedRequestId(id);
    setIsRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedRequestId) {
      handleUpdateStatus(selectedRequestId, 'rejected', rejectionReason);
    }
  };

  if (loading) {
    return <div className="text-center py-4">稟議リストを読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">エラー: {error}</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>件名</TableHead>
            <TableHead>申請者</TableHead>
            <TableHead>金額</TableHead>
            <TableHead className="w-[150px]">メリット</TableHead>{' '}
            {/* 列幅を調整 */}
            <TableHead className="w-[150px]">回避可能なリスク</TableHead>{' '}
            {/* 列幅を調整 */}
            <TableHead>ステータス</TableHead>
            <TableHead>申請日時</TableHead>
            {isApprover && <TableHead>アクション</TableHead>}{' '}
            {/* 承認者の場合のみ表示 */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isApprover ? 9 : 8} className="text-center">
                表示する稟議がありません。
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.id}</TableCell>
                <TableCell>{request.title}</TableCell>
                <TableCell>{request.applicant}</TableCell>
                <TableCell>{request.amount.toLocaleString()}円</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {request.benefits}
                </TableCell>{' '}
                {/* 長い場合は省略 */}
                <TableCell className="max-w-[200px] truncate">
                  {request.avoidableRisks}
                </TableCell>{' '}
                {/* 長い場合は省略 */}
                <TableCell>
                  <Badge
                    variant={
                      request.status === 'approved'
                        ? 'default'
                        : request.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {request.status === 'pending' && '承認待ち'}
                    {request.status === 'approved' && '承認済み'}
                    {request.status === 'rejected' && '却下済み'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(request.createdAt).toLocaleString()}
                </TableCell>
                {isApprover &&
                  request.status === 'pending' && ( // 承認者の場合のみアクションを表示
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            アクション
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(request.id, 'approved')
                            }
                          >
                            承認
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openRejectDialog(request.id)}
                          >
                            却下
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                {isApprover && request.status !== 'pending' && (
                  <TableCell>
                    - {/* 承認済み/却下済みの場合はアクションなし */}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 却下理由入力ダイアログ */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>稟議却下</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="却下理由を入力してください"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={confirmReject} disabled={!rejectionReason.trim()}>
              却下を確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApprovalList;
