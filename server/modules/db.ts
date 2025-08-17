import type { ApprovalForm, ApprovalRequest } from '~/types/approval';
import { generateUniqueId } from './id';
import { useLock_ } from './lock';
import { generateEmailBody_, sendApprovalNotification_ } from './mailer';

const DB_SHEET_NAME = 'WF｜Requests';
const COLUMN_MAP = {
  id: 1,
  title: 2,
  applicant: 3,
  approver: 4,
  status: 5,
  amount: 6,
  description: 7,
  benefits: 8,
  avoidableRisks: 9,
  createdAt: 10,
  approvedAt: 11,
  rejectionReason: 12,
  approverComment: 13,
};

/**
 * 新しい稟議申請を作成し、スプレッドシートに追記する
 * @param formData 稟議申請フォームのデータ
 * @returns 成功メッセージ
 */
export function createApprovalRequest(formData: ApprovalForm) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_SHEET_NAME);
  if (!sheet) {
    throw new Error(`DBシート「${DB_SHEET_NAME}」が見つかりません`);
  }
  const userEmail = Session.getActiveUser().getEmail();
  const now = new Date();

  const newId = `APR_${generateUniqueId()}`;

  useLock_(() => {
    // スプレッドシートの最終行にデータを追記
    sheet.appendRow([
      newId, // 生成したIDを使用
      formData.title,
      userEmail,
      formData.approver, // 指定された承認者を保存
      'pending', // ステータス
      formData.amount,
      formData.description,
      formData.benefits,
      formData.avoidableRisks,
      Utilities.formatDate(now, 'JST', 'yyyy/MM/dd HH:mm:ss'),
      '', // 承認日時
      '', // 却下理由
      '', // 承認者コメント
    ]);
  });

  // 承認者にメール通知（申請者をCcに追加）
  const requestDetails = {
    id: newId,
    title: formData.title,
    applicant: userEmail,
    approver: formData.approver,
    status: 'pending',
  };
  const subject = `【稟議申請】新しい稟議が届きました: ${formData.title}`;
  const body = generateEmailBody_(requestDetails);
  sendApprovalNotification_(formData.approver, subject, body, {
    cc: userEmail,
  });

  return '稟議申請が正常に作成されました。';
}

/**
 * 既存の稟議申請を編集する
 * @param id 編集対象の稟議申請ID
 * @param formData 新しい稟議申請フォームのデータ
 * @returns 成功メッセージ
 */
export function editApprovalRequest(id: string, formData: ApprovalForm) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_SHEET_NAME);
  if (!sheet) {
    throw new Error(`DBシート「${DB_SHEET_NAME}」が見つかりません`);
  }
  const userEmail = Session.getActiveUser().getEmail();

  useLock_(() => {
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('指定されたIDの稟議申請が見つかりません。');
    }

    const targetRow = values[rowIndex];
    const applicant = targetRow[COLUMN_MAP.applicant - 1];
    const status = targetRow[COLUMN_MAP.status - 1];

    if (applicant !== userEmail) {
      throw new Error('この稟議を編集する権限がありません。');
    }
    if (status !== 'pending') {
      throw new Error('この稟議は未承認状態ではないため、編集できません。');
    }

    // 該当行のデータを更新
    sheet.getRange(rowIndex + 1, COLUMN_MAP.title).setValue(formData.title);
    sheet
      .getRange(rowIndex + 1, COLUMN_MAP.approver)
      .setValue(formData.approver);
    sheet.getRange(rowIndex + 1, COLUMN_MAP.amount).setValue(formData.amount);
    sheet
      .getRange(rowIndex + 1, COLUMN_MAP.description)
      .setValue(formData.description);
    sheet
      .getRange(rowIndex + 1, COLUMN_MAP.benefits)
      .setValue(formData.benefits);
    sheet
      .getRange(rowIndex + 1, COLUMN_MAP.avoidableRisks)
      .setValue(formData.avoidableRisks);
  });

  // 承認者に更新を通知
  const requestDetails = {
    id,
    title: formData.title,
    applicant: userEmail,
    approver: formData.approver,
    status: 'pending (更新)',
  };
  const subject = `【稟議更新】稟議が更新されました: ${formData.title}`;
  const body = generateEmailBody_(requestDetails);
  sendApprovalNotification_(formData.approver, subject, body, {
    cc: userEmail,
  });

  return '稟議申請が正常に更新されました。';
}

/**
 * スプレッドシートから稟議申請を取得する（ページネーション対応）
 * @param limit 取得件数
 * @param offset 開始位置
 * @returns 稟議申請の配列と総件数
 */
export function getApprovalRequests(limit = 10, offset = 0) {
  const userEmail = Session.getActiveUser().getEmail();
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_SHEET_NAME);
  if (!sheet) {
    throw new Error(`DBシート「${DB_SHEET_NAME}」が見つかりません`);
  }

  let approvalRequests: ApprovalRequest[] = [];
  let total = 0;

  useLock_(() => {
    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= 1) {
      // ヘッダーのみの場合は空
    } else {
      // ヘッダー行をスキップ
      values.shift();
      const allRequests = values
        .map(
          (row) =>
            ({
              id: row[COLUMN_MAP.id - 1],
              title: row[COLUMN_MAP.title - 1],
              applicant: row[COLUMN_MAP.applicant - 1],
              approver: row[COLUMN_MAP.approver - 1],
              status: row[COLUMN_MAP.status - 1],
              amount: row[COLUMN_MAP.amount - 1],
              description: row[COLUMN_MAP.description - 1],
              benefits: row[COLUMN_MAP.benefits - 1],
              avoidableRisks: row[COLUMN_MAP.avoidableRisks - 1],
              createdAt: row[COLUMN_MAP.createdAt - 1],
              approvedAt: row[COLUMN_MAP.approvedAt - 1],
              rejectionReason: row[COLUMN_MAP.rejectionReason - 1],
              approverComment: row[COLUMN_MAP.approverComment - 1],
            }) satisfies ApprovalRequest,
        )
        .filter(
          (request) =>
            request.status !== 'deleted' &&
            (request.approver === userEmail || request.applicant === userEmail),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ); // 降順にソート

      total = allRequests.length;
      approvalRequests = allRequests.slice(offset, offset + limit);
    }
  });

  return JSON.stringify({ data: approvalRequests, total });
}

/**
 * 稟議申請のステータスを更新する
 * @param id 稟議申請ID
 * @param newStatus 新しいステータス ('approved' or 'rejected')
 * @param reason 却下理由 (却下時のみ)
 * @param approverComment 承認コメント (承認時のみ)
 * @returns 成功メッセージ
 */
export function updateApprovalStatus(
  id: string,
  newStatus: 'approved' | 'rejected',
  reason?: string,
  approverComment?: string,
) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_SHEET_NAME);
  if (!sheet) {
    throw new Error(`DBシート「${DB_SHEET_NAME}」が見つかりません`);
  }

  useLock_(() => {
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('指定されたIDの稟議申請が見つかりません。');
    }

    const userEmail = Session.getActiveUser().getEmail();
    const approverEmail = values[rowIndex][COLUMN_MAP.approver - 1];

    if (userEmail !== approverEmail) {
      throw new Error('この稟議を承認・却下する権限がありません。');
    }

    const now = new Date();

    const updatedValues = [...values[rowIndex]];
    updatedValues[COLUMN_MAP.status - 1] = newStatus;
    updatedValues[COLUMN_MAP.approvedAt - 1] = Utilities.formatDate(
      now,
      'JST',
      'yyyy/MM/dd HH:mm:ss',
    );
    updatedValues[COLUMN_MAP.rejectionReason - 1] = reason || '';
    updatedValues[COLUMN_MAP.approverComment - 1] = approverComment || '';
    sheet
      .getRange(rowIndex + 1, 1, 1, updatedValues.length)
      .setValues([updatedValues]);

    // 承認者と申請者にメール通知
    const applicantEmail = updatedValues[COLUMN_MAP.applicant - 1];
    const requestDetails = {
      id: updatedValues[COLUMN_MAP.id - 1],
      title: updatedValues[COLUMN_MAP.title - 1],
      applicant: applicantEmail,
      approver: updatedValues[COLUMN_MAP.approver - 1],
      status: newStatus,
      comment: newStatus === 'approved' ? approverComment : reason,
    };
    const subject = `【稟議${newStatus === 'approved' ? '承認' : '却下'}】${updatedValues[COLUMN_MAP.title - 1]}`;
    const body = generateEmailBody_(requestDetails);
    // 承認者自身がアクションしているので、申請者への通知がメイン
    // To: 申請者, Cc: 承認者
    sendApprovalNotification_(applicantEmail, subject, body, {
      cc: approverEmail,
    });
  });

  return `稟議申請ID: ${id} のステータスが ${newStatus} に更新されました。`;
}

/**
 * 稟議申請を申請者自身が取り下げる
 * @param id 稟議申請ID
 * @returns 成功メッセージ
 */
export function withdrawApprovalRequest(id: string) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_SHEET_NAME);
  if (!sheet) {
    throw new Error(`DBシート「${DB_SHEET_NAME}」が見つかりません`);
  }

  useLock_(() => {
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('指定されたIDの稟議申請が見つかりません。');
    }

    const userEmail = Session.getActiveUser().getEmail();
    const applicantEmail = values[rowIndex][COLUMN_MAP.applicant - 1];

    if (userEmail !== applicantEmail) {
      throw new Error('この稟議を取り下げる権限がありません。');
    }

    const updatedValues = [...values[rowIndex]];
    updatedValues[COLUMN_MAP.status - 1] = 'withdrawn';
    sheet
      .getRange(rowIndex + 1, 1, 1, updatedValues.length)
      .setValues([updatedValues]);

    // 承認者と申請者にメール通知
    const approverEmail = updatedValues[COLUMN_MAP.approver - 1];
    const requestDetails = {
      id: updatedValues[COLUMN_MAP.id - 1],
      title: updatedValues[COLUMN_MAP.title - 1],
      applicant: applicantEmail,
      approver: approverEmail,
      status: 'withdrawn',
    };
    const subject = `【稟議取り下げ】${updatedValues[COLUMN_MAP.title - 1]}が取り下げられました`;
    const body = generateEmailBody_(requestDetails);
    // To: 承認者, Cc: 申請者
    sendApprovalNotification_(approverEmail, subject, body, {
      cc: applicantEmail,
    });
  });

  return `稟議申請ID: ${id} が正常に取り下げられました。`;
}
