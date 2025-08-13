import type { ApprovalForm, ApprovalRequest } from '~/types/approval';
import { useLock_ } from './lock';
import { generateEmailBody_, sendApprovalNotification_ } from './mailer';

/**
 * 新しい稟議申請を作成し、スプレッドシートに追記する
 * @param formData 稟議申請フォームのデータ
 * @returns 成功メッセージ
 */
export function createApprovalRequest(formData: ApprovalForm) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('WF｜Requests');
  if (!sheet) {
    throw new Error('DBシート「WF｜Requests」が見つかりません');
  }
  const userEmail = Session.getActiveUser().getEmail();
  const now = new Date();

  useLock_(() => {
    // スプレッドシートの最終行にデータを追記
    sheet.appendRow([
      `APR-${Utilities.getUuid()}`, // ユニークなID
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

  // 申請者と承認者にメール通知
  const requestDetails = {
    id: `APR-${Utilities.getUuid()}`,
    title: formData.title,
    applicant: userEmail,
    approver: formData.approver,
    status: 'pending',
  };
  const subject = `【稟議申請】新しい稟議が届きました: ${formData.title}`;
  const body = generateEmailBody_(requestDetails);
  sendApprovalNotification_(userEmail, subject, body);
  sendApprovalNotification_(formData.approver, subject, body);

  return '稟議申請が正常に作成されました。';
}

/**
 * スプレッドシートからすべての稟議申請を取得する
 * @returns 稟議申請の配列
 */
export function getApprovalRequests() {
  const userEmail = Session.getActiveUser().getEmail();
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('WF｜Requests');
  if (!sheet) {
    throw new Error('DBシート「WF｜Requests」が見つかりません');
  }

  const approvalRequests: ApprovalRequest[] = [];

  useLock_(() => {
    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= 1) {
      return []; // ヘッダーのみの場合は空配列を返す
    }

    // ヘッダー行をスキップして、データ行をオブジェクトに変換
    values.shift();
    approvalRequests.push(
      ...values
        .map(
          (row) =>
            ({
              id: row[0],
              title: row[1],
              applicant: row[2],
              approver: row[3],
              status: row[4],
              amount: row[5],
              description: row[6],
              benefits: row[7],
              avoidableRisks: row[8],
              createdAt: row[9],
              approvedAt: row[10],
              rejectionReason: row[11],
              approverComment: row[12],
            }) satisfies ApprovalRequest,
        )
        .filter(
          (request) =>
            request.status !== 'deleted' &&
            (request.approver === userEmail || request.applicant === userEmail),
        ),
    );
  });

  return JSON.stringify(approvalRequests);
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
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('WF｜Requests');
  if (!sheet) {
    throw new Error('DBシート「WF｜Requests」が見つかりません');
  }

  useLock_(() => {
    const values = sheet.getDataRange().getValues();

    const rowIndex = values.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('指定されたIDの稟議申請が見つかりません。');
    }

    const userEmail = Session.getActiveUser().getEmail();
    const approverEmail = values[rowIndex][3];

    if (userEmail !== approverEmail) {
      throw new Error('この稟議を承認・却下する権限がありません。');
    }

    const now = new Date();

    const updatedValues = [...values[rowIndex]];
    updatedValues[4] = newStatus;
    updatedValues[10] = Utilities.formatDate(now, 'JST', 'yyyy/MM/dd HH:mm:ss');
    updatedValues[11] = reason || '';
    updatedValues[12] = approverComment || '';
    sheet
      .getRange(rowIndex + 1, 1, 1, updatedValues.length)
      .setValues([updatedValues]);

    // 申請者にメール通知
    const requestDetails = {
      id: updatedValues[0],
      title: updatedValues[1],
      applicant: updatedValues[2],
      approver: updatedValues[3],
      status: newStatus,
      comment: approverComment,
    };
    const subject = `【稟議${newStatus === 'approved' ? '承認' : '却下'}】${updatedValues[1]}`;
    const body = generateEmailBody_(requestDetails);
    sendApprovalNotification_(updatedValues[2], subject, body); // 申請者に通知
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
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('WF｜Requests');
  if (!sheet) {
    throw new Error('DBシート「WF｜Requests」が見つかりません');
  }

  useLock_(() => {
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('指定されたIDの稟議申請が見つかりません。');
    }

    const userEmail = Session.getActiveUser().getEmail();
    const applicantEmail = values[rowIndex][2];

    if (userEmail !== applicantEmail) {
      throw new Error('この稟議を取り下げる権限がありません。');
    }

    const updatedValues = [...values[rowIndex]];
    updatedValues[4] = 'withdrawn';
    sheet
      .getRange(rowIndex + 1, 1, 1, updatedValues.length)
      .setValues([updatedValues]);

    // 承認者と申請者にメール通知
    const requestDetails = {
      id: updatedValues[0],
      title: updatedValues[1],
      applicant: updatedValues[2],
      approver: updatedValues[3],
      status: 'withdrawn',
    };
    const subject = `【稟議取り下げ】${updatedValues[1]}が取り下げられました`;
    const body = generateEmailBody_(requestDetails);
    sendApprovalNotification_(applicantEmail, subject, body);
    sendApprovalNotification_(updatedValues[3], subject, body);
  });

  return `稟議申請ID: ${id} が正常に取り下げられました。`;
}
