/**
 * 稟議申請のデータ型
 */
export type ApprovalRequest = {
  id: string;
  /** 稟議タイトル */
  title: string;
  /** 申請者メールアドレス */
  applicant: string;
  /** 承認者メールアドレス */
  approver: string | null;
  /** ステータス */
  status: 'pending' | 'approved' | 'rejected';
  /** 金額 */
  amount: number;
  /** 導入によるメリット */
  benefits: string;
  /** 懸念されるリスク */
  avoidableRisks: string;
  /** 申請日時 (ISO 8601形式) */
  createdAt: string;
  /** 承認日時 (ISO 8601形式) */
  approvedAt: string | null;
  /** 却下理由 */
  rejectionReason: string | null;
};

/**
 * 稟議申請フォームのデータ型（zodスキーマ用）
 */
export type ApprovalFormType = {
  title: string;
  amount: number;
  benefits: string;
  avoidableRisks: string;
  approver: string;
};
