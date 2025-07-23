export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  benefits: string; // 購買対象のメリット
  avoidableRisks: string; // 回避可能なリスク
  applicant: string;
  status: ApprovalStatus;
  createdAt: string; // ISO 8601形式の文字列
  approvedAt?: string; // ISO 8601形式の文字列
  approver?: string;
  rejectionReason?: string;
}

// GASバックエンドからフロントエンドに返すデータ構造
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
