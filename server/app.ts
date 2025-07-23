import type { ApprovalRequest } from '../types/approval';

export function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate();
}

/**
 * 稟議申請データをスプレッドシートに保存するGAS関数
 * @param requestData 申請データ
 * @returns 保存された申請データ（IDが付与されたもの）
 */
export function createApprovalRequest(requestData: {
  title: string;
  description: string;
  amount: number;
  benefits: string;
  avoidableRisks: string;
  applicant: string;
}): string {
  // フロントエンドにJSON文字列で返すためstring型
  try {
    const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // ★ここに作成したスプレッドシートのIDを設定★
    const sheetName = 'Sheet1'; // スプレッドシートのシート名

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`シート '${sheetName}' が見つかりません。`);
    }

    // 新しいIDを生成 (簡易的な例、実際は重複しないように工夫が必要)
    const lastRow = sheet.getLastRow();
    const newId = `APR-${lastRow + 1}`;

    const now = new Date();
    const createdAt = now.toISOString(); // ISO 8601形式で保存

    const newRow = [
      newId,
      requestData.title,
      requestData.description,
      requestData.amount,
      requestData.benefits,
      requestData.avoidableRisks,
      requestData.applicant,
      'pending', // 初期ステータスは「保留中」
      createdAt,
      '', // 承認日時
      '', // 承認者
      '', // 却下理由
    ];

    sheet.appendRow(newRow);

    const result: ApprovalRequest = {
      id: newId,
      title: requestData.title,
      description: requestData.description,
      amount: requestData.amount,
      benefits: requestData.benefits,
      avoidableRisks: requestData.avoidableRisks,
      applicant: requestData.applicant,
      status: 'pending',
      createdAt: createdAt,
    };

    return JSON.stringify({ success: true, data: result });
  } catch (e: any) {
    console.error('稟議申請エラー:', e);
    return JSON.stringify({ success: false, error: e.message });
  }
}
