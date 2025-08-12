import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ApprovalRequest } from '@/../types/approval';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { parameters } from '@/lib/parameters';
import { serverScripts } from '@/lib/server';

// 詳細表示用のモーダルコンポーネント
const DetailDialog = ({
  request,
  open,
  onOpenChange,
}: {
  request: ApprovalRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!request) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>稟議詳細: {request.title}</DialogTitle>
          <DialogDescription>ID: {request.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                申請者
              </p>
              <p className="font-semibold">{request.applicant}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                承認者
              </p>
              <p className="font-semibold">{request.approver || '未指定'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">金額</p>
            <p className="font-semibold">¥{request.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              導入によるメリット
            </p>
            <p>{request.benefits}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              懸念されるリスク
            </p>
            <p>{request.avoidableRisks}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              ステータス
            </p>
            <Badge variant={getStatusBadgeVariant(request.status)}>
              {request.status === 'pending' && '未承認'}
              {request.status === 'approved' && '承認済み'}
              {request.status === 'rejected' && '却下済み'}
              {request.status === 'withdrawn' && '取り下げ済み'}
            </Badge>
          </div>
          {request.approverComment && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                承認者コメント
              </p>
              <p>{request.approverComment}</p>
            </div>
          )}
          {request.rejectionReason && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                却下理由
              </p>
              <p>{request.rejectionReason}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              申請日時
            </p>
            <p>{new Date(request.createdAt).toLocaleString()}</p>
          </div>
          {request.approvedAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                承認日時
              </p>
              <p>{new Date(request.approvedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function ApprovalList() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);

  // 稟議一覧とユーザー情報を取得
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const allRequests = await serverScripts.getApprovalRequests();
      setRequests(JSON.parse(allRequests));

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: onMounted
  useEffect(() => {
    fetchRequests();
  }, []);

  // 承認ステータス更新処理
  const handleUpdateStatus = async (
    id: string,
    status: 'approved' | 'rejected',
    reason?: string,
    comment?: string,
  ) => {
    try {
      await serverScripts.updateApprovalStatus(id, status, reason, comment);
      toast.success('更新成功', {
        description: `稟議のステータスが${status === 'approved' ? '承認' : '却下'}されました。`,
      });
      fetchRequests();
    } catch (error) {
      toast.error('更新失敗', {
        description: `ステータス更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
      console.error('GASエラー:', error);
    }
  };

  // 取り下げ処理
  const handleWithdrawRequest = async (id: string) => {
    try {
      await serverScripts.withdrawApprovalRequest(id);
      toast.success('取り下げ成功', {
        description: '稟議申請が正常に取り下げられました。',
      });
      fetchRequests();
    } catch (error) {
      toast.error('取り下げ失敗', {
        description: `取り下げに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
      console.error('GASエラー:', error);
    }
  };

  const getStatusBadgeVariant = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'withdrawn':
        return 'warning';
      // case 'pending':
      default:
        return 'info';
    }
  };

  const handleOpenApproveDialog = (id: string) => {
    setSelectedRequestId(id);
    setOpenApproveDialog(true);
  };

  const handleApproveWithComment = () => {
    if (selectedRequestId) {
      handleUpdateStatus(
        selectedRequestId,
        'approved',
        undefined,
        approveComment,
      );
      setOpenApproveDialog(false);
      setApproveComment('');
      setSelectedRequestId(null);
    }
  };

  const handleOpenDetailDialog = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setOpenDetailDialog(true);
  };

  if (loading) {
    return <p>ロード中...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>稟議一覧</CardTitle>
        <CardDescription>
          自分が申請した稟議の進捗を確認したり、取り下げたりできます。また、承認者として指定された稟議を承認・却下できます。
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
                        {request.status === 'withdrawn' && '取り下げ済み'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetailDialog(request)}
                      >
                        詳細
                      </Button>
                      {request.status === 'pending' &&
                        request.applicant === currentUserEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWithdrawRequest(request.id)}
                          >
                            取り下げ
                          </Button>
                        )}
                      {request.status === 'pending' &&
                        request.approver === currentUserEmail && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOpenApproveDialog(request.id)
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
      {/* 承認コメント入力ダイアログ */}
      <Dialog open={openApproveDialog} onOpenChange={setOpenApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>稟議を承認</DialogTitle>
            <DialogDescription>
              承認コメントを入力してください（任意）。
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="承認コメント"
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
          />
          <Button onClick={handleApproveWithComment}>承認する</Button>
        </DialogContent>
      </Dialog>
      <DetailDialog
        request={selectedRequest}
        open={openDetailDialog}
        onOpenChange={setOpenDetailDialog}
      />
    </Card>
  );
}

// Badgeのvariantを定義
function getStatusBadgeVariant(
  status: ApprovalRequest['status'],
): 'success' | 'destructive' | 'warning' | 'info' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'withdrawn':
      return 'warning';
    // case 'pending':
    default:
      return 'info';
  }
}
