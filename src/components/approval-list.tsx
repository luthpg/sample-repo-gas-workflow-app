import type { VariantProps } from 'class-variance-authority';
import Linkify from 'linkify-react';
import type { Opts as LinkifyOptions } from 'linkifyjs';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApprovalForm } from '@/components/approval-form';
import { Loader } from '@/components/loading-spinner';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useIsMobile } from '@/hooks/use-mobile';
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

const getStatusText = (status: ApprovalRequest['status']) => {
  switch (status) {
    case 'pending':
      return '未承認';
    case 'approved':
      return '承認済';
    case 'rejected':
      return '却下済';
    case 'withdrawn':
      return '取下済';
    default:
      return '';
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
  onEditRequest,
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
  onEditRequest: (request: ApprovalRequest) => void;
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

  const handleEdit = () => {
    onEditRequest(request);
    onOpenChange(false); // 詳細ダイアログを閉じる
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-xl">
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
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                導入によるメリット
              </p>
              <Linkify
                as="p"
                options={linkifyOptions}
                className="whitespace-pre-wrap"
              >
                {request.benefits}
              </Linkify>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                懸念されるリスク
              </p>
              <Linkify
                as="p"
                options={linkifyOptions}
                className="whitespace-pre-wrap"
              >
                {request.avoidableRisks}
              </Linkify>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                ステータス
              </p>
              <Badge variant={getStatusBadgeVariant(request.status)}>
                {getStatusText(request.status)}
              </Badge>
            </div>
            {request.approverComment && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  承認者コメント
                </p>
                <Linkify
                  as="p"
                  options={linkifyOptions}
                  className="whitespace-pre-wrap"
                >
                  {request.approverComment}
                </Linkify>
              </div>
            )}
            {request.rejectionReason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  却下理由
                </p>
                <Linkify
                  as="p"
                  options={linkifyOptions}
                  className="whitespace-pre-wrap"
                >
                  {request.rejectionReason}
                </Linkify>
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
          <DialogFooter className="flex-wrap justify-end gap-2">
            {request.status === 'pending' &&
              request.applicant === currentUserEmail && (
                <>
                  <Button variant="outline" onClick={handleEdit}>
                    編集
                  </Button>
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={handleWithdraw}
                  >
                    取り下げ
                  </Button>
                </>
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

// --- Mobile View Component ---
const MobileApprovalList = ({
  requests,
  onOpenDetailDialog,
}: {
  requests: ApprovalRequest[];
  onOpenDetailDialog: (request: ApprovalRequest) => void;
}) => (
  <div className="space-y-4">
    {requests.map((request) => (
      <Card
        key={request.id}
        onClick={() => onOpenDetailDialog(request)}
        className="cursor-pointer transition-colors hover:bg-muted/50"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="break-all pr-2 text-base font-bold">
              {request.title}
            </CardTitle>
            <Badge variant={getStatusBadgeVariant(request.status)}>
              {getStatusText(request.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-muted-foreground">申請者</p>
            <p className="truncate font-medium">{request.applicant}</p>
          </div>
          <div>
            <p className="text-muted-foreground">承認者</p>
            <p className="truncate font-medium">{request.approver}</p>
          </div>
          <div>
            <p className="text-muted-foreground">金額</p>
            <p className="font-medium">
              ¥{(request.amount ?? 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">申請日</p>
            <p className="font-medium">{formatDate(request.createdAt)}</p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// --- Desktop View Component ---
const DesktopApprovalList = ({
  requests,
  onOpenDetailDialog,
}: {
  requests: ApprovalRequest[];
  onOpenDetailDialog: (request: ApprovalRequest) => void;
}) => (
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
            <TableCell>¥{(request.amount ?? 0).toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(request.status)}>
                {getStatusText(request.status)}
              </Badge>
            </TableCell>
            <TableCell>{request.applicant}</TableCell>
            <TableCell>{request.approver}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenDetailDialog(request)}
              >
                詳細
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// --- Main Component ---
export function ApprovalList() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const isMobile = useIsMobile();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const resultJson = await serverScripts.getApprovalRequests(
        itemsPerPage,
        (currentPage - 1) * itemsPerPage,
      );
      const result = JSON.parse(resultJson);
      setRequests(result.data || []);
      setTotalItems(result.total || 0);
      setCurrentUserEmail(parameters.userAddress);
    } catch (error) {
      toast.error('データ取得エラー', {
        description: `稟議データの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
      console.error('GASエラー:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: functions is not required
  useEffect(() => {
    const targetId = parameters.parameter?.id;
    if (!loading && requests.length > 0 && targetId && !initialLoadDone) {
      const targetRequest = requests.find((r) => r.id === targetId);
      if (targetRequest) {
        handleOpenDetailDialog(targetRequest);
      } else {
        toast.error('指定された申請が見つかりません', {
          description: `ID: ${targetId} の申請は存在しないか、アクセス権がありません。`,
        });
      }
      google.script.history.replace({}, {}, ''); // 使用済のパラメータをURLから削除
      setInitialLoadDone(true);
    }
  }, [loading, requests, initialLoadDone]);

  const handleUpdateStatus = async (
    id: string,
    status: 'approved' | 'rejected',
    reason?: string,
    comment?: string,
  ) => {
    setLoading(true);
    try {
      await serverScripts.updateApprovalStatus(id, status, reason, comment);
      toast.success('更新成功', {
        description: `稟議のステータスが${status === 'approved' ? '承認' : '却下'}されました。`,
      });
      await fetchRequests();
    } catch (error) {
      toast.error('更新失敗', {
        description: `ステータス更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
      console.error('GASエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async (id: string) => {
    setLoading(true);
    try {
      await serverScripts.withdrawApprovalRequest(id);
      toast.success('取り下げ成功', {
        description: '稟議申請が正常に取り下げられました。',
      });
      await fetchRequests();
    } catch (error) {
      toast.error('取り下げ失敗', {
        description: `取り下げに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
      console.error('GASエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetailDialog = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setOpenDetailDialog(true);
  };

  const handleOpenEditDialog = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setOpenEditDialog(true);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader className="h-8 w-8 text-muted-foreground" />
        </div>
      );
    }
    if (requests.length === 0) {
      return (
        <p className="text-center text-muted-foreground">
          表示する稟議申請はありません。
        </p>
      );
    }
    return isMobile ? (
      <MobileApprovalList
        requests={requests}
        onOpenDetailDialog={handleOpenDetailDialog}
      />
    ) : (
      <DesktopApprovalList
        requests={requests}
        onOpenDetailDialog={handleOpenDetailDialog}
      />
    );
  };

  return (
    <>
      <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader>
          <CardTitle>稟議一覧</CardTitle>
          <CardDescription>
            自分が申請した稟議の進捗を確認したり、取り下げたりできます。また、承認者として指定された稟議を承認・却下できます。
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
        {totalItems > 0 && (
          <CardFooter className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {totalItems}件中{' '}
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} -{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)}件を表示
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">表示件数:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-10">
                      {itemsPerPage}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[5, 10, 20, 50, 100].map((size) => (
                      <DropdownMenuItem
                        key={size}
                        onSelect={() => handleItemsPerPageChange(String(size))}
                      >
                        {size}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || loading}
                >
                  前へ
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages > 0 ? totalPages : 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || loading}
                >
                  次へ
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      <DetailDialog
        request={selectedRequest}
        open={openDetailDialog}
        onOpenChange={setOpenDetailDialog}
        currentUserEmail={currentUserEmail}
        onUpdateStatus={handleUpdateStatus}
        onWithdrawRequest={handleWithdrawRequest}
        onEditRequest={handleOpenEditDialog}
      />
      {/* 編集用フォーム */}
      {openEditDialog && (
        <ApprovalForm
          onFormSubmitSuccess={() => {
            setOpenEditDialog(false);
            fetchRequests();
          }}
          requestData={selectedRequest}
          open={openEditDialog}
          onOpenChange={setOpenEditDialog}
        />
      )}
    </>
  );
}
