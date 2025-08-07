import type { ApprovalRequest } from '~/types/approval';
import { useLock } from './lock';

/**
 * 新しい稟議申請を作成し、スプレッドシートに追記する
 * @param formData 稟議申請フォームのデータ
 * @returns 成功メッセージ
 */
export function createApprovalRequest(formData: {
  title: string;
  amount: number;
  benefits: string;
  avoidableRisks: string;
  approver: string;
}) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const userEmail = Session.getActiveUser().getEmail();
  const now = new Date();

  useLock(() => {
    // スプレッドシートの最終行にデータを追記
    sheet.appendRow([
      `APR-${Utilities.getUuid()}`, // ユニークなID
      formData.title,
      userEmail,
      formData.approver, // 指定された承認者を保存
      'pending', // ステータス
      formData.amount,
      formData.benefits,
      formData.avoidableRisks,
      Utilities.formatDate(now, 'JST', 'yyyy/MM/dd HH:mm:ss'),
      '', // 承認日時
      '', // 却下理由
    ]);
  });

  return '稟議申請が正常に作成されました。';
}

/**
 * スプレッドシートからすべての稟議申請を取得する
 * @returns 稟議申請の配列
 */
export function getApprovalRequests() {
  const userEmail = Session.getActiveUser().getEmail();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  const approvalRequests: ApprovalRequest[] = [];

  useLock(() => {
    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= 1) {
      return []; // ヘッダーのみの場合は空配列を返す
    }

    // ヘッダー行をスキップして、データ行をオブジェクトに変換
    values.shift();
    approvalRequests.push(
      ...values
        .map((row) => ({
          id: row[0],
          title: row[1],
          applicant: row[2],
          approver: row[3],
          status: row[4],
          amount: row[5],
          benefits: row[6],
          avoidableRisks: row[7],
          createdAt: row[8],
          approvedAt: row[9],
          rejectionReason: row[10],
        }))
        .filter(
          (request) =>
            request.status !== 'deleted' &&
            (request.approver === userEmail || request.applicant === userEmail),
        ),
    );
  });

  return approvalRequests;
}

/**
 * 稟議申請のステータスを更新する
 * 承認者として指定されたユーザーのみが実行可能
 * @param id 稟議申請ID
 * @param newStatus 新しいステータス ('approved' or 'rejected')
 * @param reason 却下理由 (却下時のみ)
 * @returns 成功メッセージ
 */
export function updateApprovalStatus(
  id: string,
  newStatus: 'approved' | 'rejected',
  reason?: string,
) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  useLock(() => {
    const values = sheet.getDataRange().getValues();

    // IDに基づいて該当する行を検索
    const rowIndex = values.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('指定されたIDの稟議申請が見つかりません。');
    }

    const userEmail = Session.getActiveUser().getEmail();
    const approverEmail = values[rowIndex][3]; // スプレッドシートから承認者メールアドレスを取得

    // 現在のユーザーが承認者でなければエラー
    if (userEmail !== approverEmail) {
      throw new Error('この稟議を承認・却下する権限がありません。');
    }

    const now = new Date();

    // ステータス、承認者、日時、却下理由を更新
    const updatedValues = [...values[rowIndex]];
    updatedValues[3] = userEmail;
    updatedValues[4] = newStatus;
    updatedValues[9] = Utilities.formatDate(now, 'JST', 'yyyy/MM/dd HH:mm:ss');
    updatedValues[10] = reason || '';
    sheet
      .getRange(rowIndex + 1, 1, 1, updatedValues.length)
      .setValues([updatedValues]);
  });

  return `稟議申請ID: ${id} のステータスが ${newStatus} に更新されました。`;
}
