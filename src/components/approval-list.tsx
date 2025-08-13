import type { VariantProps } from 'class-variance-authority';
import Linkify from 'linkify-react';
import type { Opts as LinkifyOptions } from 'linkifyjs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { formatDate } from '@/lib/date';
import { parameters } from '@/lib/parameters';
import { serverScripts } from '@/lib/server';
import type { ApprovalRequest } from '~/types/approval';

const getStatusBadgeVariant = (
  status: ApprovalRequest['status'],
): VariantProps<typeof badgeVariants>['variant'] => {
  switch (status) {
    case 'approved':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    case 'withdrawn':
      return 'destructive';
    // case 'pending':
    default:
      return 'outline';
  }
};

// 詳細表示用のモーダルコンポーネント
const DetailDialog = ({
  request,
  open,
  onOpenChange,
  currentUserEmail,
  onUpdateStatus,
  onWithdrawRequest,
}: {
  request: ApprovalRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserEmail: string | null;
  onUpdateStatus: (
    id: string,
    status: 'approved' | 'rejected',
    reason?: string,
    comment?: string,
  ) => void;
  onWithdrawRequest: (id: string) => void;
}) => {
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [approveComment, setApproveComment] = useState('');

  if (!request) return null;

  const linkifyOptions: LinkifyOptions = {
    className: 'text-blue-400',
    target: '_blank',
    rel: 'noopener noreferrer',
  };

  const handleApproveWithComment = () => {
    onUpdateStatus(request.id, 'approved', undefined, approveComment);
    setOpenApproveDialog(false);
    onOpenChange(false); // 詳細ダイアログも閉じる
    setApproveComment('');
  };

  const handleReject = () => {
    onUpdateStatus(request.id, 'rejected');
    onOpenChange(false); // 詳細ダイアログを閉じる
  };

  const handleWithdraw = () => {
    onWithdrawRequest(request.id);
    onOpenChange(false); // 詳細ダイアログを閉じる
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>稟議詳細: {request.title}</DialogTitle>
            <DialogDescription>ID: {request.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto max-h-[70vh]">
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
                <p className="font-semibold">{request.approver}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">金額</p>
              <p className="font-semibold">
                ¥{(request.amount ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                説明書き
              </p>
              <Linkify
                as="p"
                options={linkifyOptions}
                className="whitespace-pre-wrap"
              >
                {request.description}
              </Linkify>
              <p className="whitespace-pre-wrap">{request.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                導入によるメリット
              </p>
              {/* <Linkify
                as="p"
                options={linkifyOptions}
                className="whitespace-pre-wrap"
              >
                {request.benefits}
              </Linkify> */}
              <p className="whitespace-pre-wrap">{request.benefits}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                懸念されるリスク
              </p>
              {/* <Linkify
                as="p"
                options={linkifyOptions}
                className="whitespace-pre-wrap"
              >
                {request.avoidableRisks}
              </Linkify> */}
              <p className="whitespace-pre-wrap">{request.avoidableRisks}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                ステータス
              </p>
              <Badge variant={getStatusBadgeVariant(request.status)}>
                {request.status === 'pending' && '未承認'}
                {request.status === 'approved' && '承認済'}
                {request.status === 'rejected' && '却下済'}
                {request.status === 'withdrawn' && '取下済'}
              </Badge>
            </div>
            {request.approverComment && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  承認者コメント
                </p>
                {/* <Linkify
                  as="p"
                  options={linkifyOptions}
                  className="whitespace-pre-wrap"
                >
                  {request.approverComment}
                </Linkify> */}
                <p className="whitespace-pre-wrap">{request.approverComment}</p>
              </div>
            )}
            {request.rejectionReason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  却下理由
                </p>
                {/* <Linkify
                  as="p"
                  options={linkifyOptions}
                  className="whitespace-pre-wrap"
                >
                  {request.rejectionReason}
                </Linkify> */}
                <p className="whitespace-pre-wrap">{request.rejectionReason}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                申請日時
              </p>
              <p>{formatDate(request.createdAt)}</p>
            </div>
            {request.approvedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  承認日時
                </p>
                <p>{formatDate(request.approvedAt)}</p>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end">
            {request.status === 'pending' &&
              request.applicant === currentUserEmail && (
                <Button variant="outline" onClick={handleWithdraw}>
                  取り下げ
                </Button>
              )}
            {request.status === 'pending' &&
              request.approver === currentUserEmail && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setOpenApproveDialog(true)}
                  >
                    承認
                  </Button>
                  <Button variant="destructive" onClick={handleReject}>
                    却下
                  </Button>
                </>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <DialogFooter>
            <Button onClick={handleApproveWithComment}>承認する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export function ApprovalList() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);

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
                  <TableHead>金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>申請者</TableHead>
                  <TableHead>承認者</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>
                      ¥{(request.amount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status === 'pending' && '未承認'}
                        {request.status === 'approved' && '承認済み'}
                        {request.status === 'rejected' && '却下済み'}
                        {request.status === 'withdrawn' && '取り下げ済み'}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.applicant}</TableCell>
                    <TableCell>{request.approver}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetailDialog(request)}
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <DetailDialog
        request={selectedRequest}
        open={openDetailDialog}
        onOpenChange={setOpenDetailDialog}
        currentUserEmail={currentUserEmail}
        onUpdateStatus={handleUpdateStatus}
        onWithdrawRequest={handleWithdrawRequest}
      />
    </Card>
  );
}
