import type { ApprovalRequest, ApprovalStatus } from '../types/approval';

type RequestParameters<T extends string = string> = {
  queryString: string | null;
  parameter: Partial<Record<T, string> & Record<string, string>>;
  parameters: Partial<Record<T, string[]> & Record<string, string[]>>;
  pathInfo: string;
  contextPath: '';
  contentLength: number;
  postData: {
    length: number;
    type: string;
    contents: string;
    name: 'postData';
  };
};

type UrlParameterKeys = 'page' | 'id';

export type EmbeddedParameters = RequestParameters<UrlParameterKeys> & {
  userAddress: string;
};

export function doGet(e: RequestParameters<UrlParameterKeys>) {
  const userAddress = Session.getActiveUser().getEmail();
  const htmlTemplate = HtmlService.createTemplateFromFile('index');
  htmlTemplate.parameters = JSON.stringify({
    ...e.parameter,
    userAddress,
  } as EmbeddedParameters);
  const htmlOutput = htmlTemplate.evaluate();
  htmlOutput.setTitle('稟議申請フォーム');
  return htmlOutput;
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
    const createdAt = Utilities.formatDate(
      now,
      'Asia/Tokyo',
      'yyyy/MM/dd HH:mm:ss',
    );

    const newRow: [
      ApprovalRequest['id'],
      ApprovalRequest['title'],
      ApprovalRequest['description'],
      ApprovalRequest['amount'],
      ApprovalRequest['benefits'],
      ApprovalRequest['avoidableRisks'],
      ApprovalRequest['applicant'],
      ApprovalRequest['status'],
      ApprovalRequest['createdAt'],
      ApprovalRequest['approvedAt'],
      ApprovalRequest['approver'],
      ApprovalRequest['rejectionReason'],
    ] = [
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
  } catch (e) {
    console.error('稟議申請エラー:', e);
    return JSON.stringify({ success: false, error: (e as Error).message });
  }
}

/**
 * スプレッドシートからすべての稟議申請データを取得するGAS関数
 * @returns 稟議申請データの配列
 */
export function getApprovalRequests(): string {
  // フロントエンドにJSON文字列で返すためstring型
  try {
    const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // ★あなたのスプレッドシートIDを設定★
    const sheetName = 'Sheet1';

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`シート '${sheetName}' が見つかりません。`);
    }

    const range = sheet.getDataRange();
    const values = range.getValues();

    if (values.length <= 1) {
      // ヘッダー行のみの場合
      return JSON.stringify({ success: true, data: [] });
    }

    const headers = values[0];
    const dataRows = values.slice(1);

    const requests: ApprovalRequest[] = dataRows.map((row) => {
      // ヘッダーと行のインデックスをマッピングしてオブジェクトに変換
      const request: ApprovalRequest = {
        id: row[headers.indexOf('ID')],
        title: row[headers.indexOf('件名')],
        description: row[headers.indexOf('説明')],
        amount: Number(row[headers.indexOf('金額')]),
        benefits: row[headers.indexOf('メリット')],
        avoidableRisks: row[headers.indexOf('回避可能なリスク')],
        applicant: row[headers.indexOf('申請者')],
        status: row[headers.indexOf('ステータス')] as ApprovalStatus,
        createdAt: row[headers.indexOf('申請日時')],
        approvedAt: row[headers.indexOf('承認日時')] || undefined,
        approver: row[headers.indexOf('承認者')] || undefined,
        rejectionReason: row[headers.indexOf('却下理由')] || undefined,
      };
      return request;
    });

    return JSON.stringify({ success: true, data: requests });
  } catch (e: any) {
    console.error('稟議リスト取得エラー:', e);
    return JSON.stringify({ success: false, error: e.message });
  }
}

/**
 * 稟議申請のステータスを更新するGAS関数
 * @param id 稟議ID
 * @param status 更新後のステータス ('approved' or 'rejected')
 * @param reason 却下理由 (却下の場合のみ)
 * @returns 更新された稟議データ
 */
export function updateApprovalStatus(
  id: string,
  status: ApprovalStatus,
  reason?: string,
): string {
  try {
    const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // ★あなたのスプレッドシートIDを設定★
    const sheetName = 'Sheet1';

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`シート '${sheetName}' が見つかりません。`);
    }

    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0];

    const idColumnIndex = headers.indexOf('ID');
    const statusColumnIndex = headers.indexOf('ステータス');
    const approvedAtColumnIndex = headers.indexOf('承認日時');
    const approverColumnIndex = headers.indexOf('承認者');
    const rejectionReasonColumnIndex = headers.indexOf('却下理由');

    let updatedRequest: ApprovalRequest | null = null;

    for (let i = 1; i < values.length; i++) {
      if (values[i][idColumnIndex] === id) {
        values[i][statusColumnIndex] = status; // ステータスを更新

        if (status === 'approved') {
          values[i][approvedAtColumnIndex] = new Date().toISOString(); // 承認日時を記録
          values[i][approverColumnIndex] = Session.getActiveUser().getEmail(); // 承認者を記録
          values[i][rejectionReasonColumnIndex] = ''; // 却下理由をクリア
        } else if (status === 'rejected') {
          values[i][approvedAtColumnIndex] = ''; // 承認日時をクリア
          values[i][approverColumnIndex] = Session.getActiveUser().getEmail(); // 却下者を記録
          values[i][rejectionReasonColumnIndex] = reason || ''; // 却下理由を記録
        }

        sheet.getRange(i + 1, 1, 1, values[i].length).setValues([values[i]]); // 行を更新

        // 更新されたデータを取得して返す
        updatedRequest = {
          id: values[i][idColumnIndex],
          title: values[i][headers.indexOf('件名')],
          description: values[i][headers.indexOf('説明')],
          amount: Number(values[i][headers.indexOf('金額')]),
          benefits: values[i][headers.indexOf('メリット')],
          avoidableRisks: values[i][headers.indexOf('回避可能なリスク')],
          applicant: values[i][headers.indexOf('申請者')],
          status: values[i][statusColumnIndex] as ApprovalStatus,
          createdAt: values[i][headers.indexOf('申請日時')],
          approvedAt: values[i][approvedAtColumnIndex] || undefined,
          approver: values[i][approverColumnIndex] || undefined,
          rejectionReason: values[i][rejectionReasonColumnIndex] || undefined,
        };
        break;
      }
    }

    if (updatedRequest) {
      return JSON.stringify({ success: true, data: updatedRequest });
    } else {
      throw new Error(`稟議ID ${id} が見つかりません。`);
    }
  } catch (e: any) {
    console.error('ステータス更新エラー:', e);
    return JSON.stringify({ success: false, error: e.message });
  }
}
