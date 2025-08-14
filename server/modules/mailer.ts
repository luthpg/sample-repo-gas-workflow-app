/**
 * 稟議申請のステータス変更を通知するメールを送信する
 * @param to 宛先メールアドレス
 * @param subject 件名
 * @param body 本文
 */
export function sendApprovalNotification_(
  to: string,
  subject: string,
  body: string,
  options: GoogleAppsScript.Gmail.GmailAdvancedOptions = {},
) {
  try {
    GmailApp.sendEmail(to, subject, body, options);
    console.log(`Email sent to ${to} with subject: ${subject}`);
  } catch (e) {
    console.error(
      `Failed to send email to ${to}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * 稟議申請に関する詳細情報を含むメール本文を生成する
 * @param request 稟議申請データ
 * @param status 新しいステータス
 * @param comment 承認コメント
 * @returns 生成されたメール本文
 */
export function generateEmailBody_(request: {
  id: string;
  title: string;
  applicant: string;
  approver: string | null;
  status: string;
  comment?: string | null;
}) {
  let body = `稟議申請のステータスが更新されました。

-----------------------------------
[稟議詳細]
ID: ${request.id}
タイトル: ${request.title}
申請者: ${request.applicant}
承認者: ${request.approver || '未指定'}
現在のステータス: ${request.status}
`;

  if (request.comment) {
    body += `承認者コメント: ${request.comment}\n`;
  }
  body += '-----------------------------------';

  return body;
}
