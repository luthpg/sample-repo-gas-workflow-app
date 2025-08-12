/**
 * 稟議申請のデータ型
 */
export type ApprovalRequest = {
  id: string;
  title: string; // 稟議タイトル
  applicant: string; // 申請者メールアドレス
  approver: string | null; // 承認者メールアドレス
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'; // ステータス
  amount: number; // 金額
  benefits: string; // 導入によるメリット
  avoidableRisks: string; // 懸念されるリスク
  createdAt: string; // 申請日時 (ISO 8601形式)
  approvedAt: string | null; // 承認日時 (ISO 8601形式)
  rejectionReason: string | null; // 却下理由
  approverComment: string | null; // 承認者コメント
};

/**
 * 稟議申請フォームのデータ型（zodスキーマ用）
 * 承認者メールアドレスを追加
 */
export type ApprovalForm = {
  title: string;
  amount: number;
  benefits: string;
  avoidableRisks: string;
  approver: string; // 新しいフィールド
};
