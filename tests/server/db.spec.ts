import {
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  type Mocked,
  vi,
} from 'vitest';
import type { ApprovalForm } from '~/types/approval';
import {
  createApprovalRequest,
  editApprovalRequest,
  getApprovalRequests,
  updateApprovalStatus,
  withdrawApprovalRequest,
} from '../../server/modules/db';
import * as lock from '../../server/modules/lock';
import * as mailer from '../../server/modules/mailer';

// GASグローバルオブジェクトのモック
const mockSheet: Mocked<GoogleAppsScript.Spreadsheet.Sheet> = {
  appendRow: vi.fn(),
  getDataRange: vi.fn(),
  // @ts-expect-error mock function
  getRange: vi.fn(),
};
const mockSpreadsheet: {
  getSheetByName: Mock<() => GoogleAppsScript.Spreadsheet.Sheet | null>;
} = {
  getSheetByName: vi.fn(() => mockSheet),
};
const mockLock = {
  tryLock: vi.fn(() => true),
  releaseLock: vi.fn(),
};

// mailerとlockモジュールのモック
vi.spyOn(mailer, 'sendApprovalNotification_').mockImplementation(() => {});
// useLock_は渡されたコールバックを即時実行するようにモックする
vi.spyOn(lock, 'useLock_').mockImplementation((callback) => callback());

global.SpreadsheetApp = {
  getActiveSpreadsheet: () => mockSpreadsheet,
} as any;
global.Session = {
  getActiveUser: () => ({ getEmail: () => 'user@example.com' }),
} as any;
global.Utilities = {
  getUuid: () => 'mock-uuid',
  formatDate: (date: Date, tz: string, _format: string) =>
    new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: tz,
    })
      .format(date)
      .replace(/\//g, '/'),
} as any;
global.GmailApp = {
  sendEmail: vi.fn(),
} as any;
global.LockService = {
  getScriptLock: () => mockLock,
} as any;

describe('Server DB Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 各テストの前にスプレッドシートが正常に見つかる状態に戻す
    mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);
  });

  describe('createApprovalRequest', () => {
    it('新しい稟議申請を作成し、メールを送信する', () => {
      const formData: ApprovalForm = {
        title: 'New Request',
        approver: 'approver@example.com',
        amount: 1000,
        description: 'test description',
        benefits: 'test benefits',
        avoidableRisks: 'test risks',
      };

      const result = createApprovalRequest(formData);

      expect(mockSheet.appendRow).toHaveBeenCalledWith(
        expect.arrayContaining(['APR-mock-uuid', 'New Request']),
      );
      expect(mailer.sendApprovalNotification_).toHaveBeenCalledWith(
        'approver@example.com',
        expect.stringContaining('【稟議申請】'),
        expect.any(String),
        { cc: 'user@example.com' },
      );
      expect(result).toBe('稟議申請が正常に作成されました。');
    });

    it('シートが見つからない場合にエラーをスローする', () => {
      mockSpreadsheet.getSheetByName.mockReturnValue(null);
      const formData: ApprovalForm = {
        title: 'New Request',
        approver: 'approver@example.com',
        amount: 0,
      };
      expect(() => createApprovalRequest(formData)).toThrow(
        'DBシート「WF｜Requests」が見つかりません',
      );
    });
  });

  describe('editApprovalRequest', () => {
    const mockData = [
      ['ID', 'Title', 'Applicant', 'Approver', 'Status'],
      [
        'APR-001',
        'Old Title',
        'user@example.com',
        'old@example.com',
        'pending',
      ],
      [
        'APR-002',
        'Req 2',
        'another@example.com',
        'user@example.com',
        'pending',
      ],
      ['APR-003', 'Req 3', 'user@example.com', 'user@example.com', 'approved'],
    ];
    const mockRange = { setValue: vi.fn() };

    beforeEach(() => {
      mockSheet.getDataRange.mockReturnValue({
        getValues: () => mockData,
      } as any);
      mockSheet.getRange.mockReturnValue(mockRange as any);
      global.Session = {
        getActiveUser: () => ({ getEmail: () => 'user@example.com' }),
      } as any;
    });

    it('稟議申請を正常に編集し、メールを送信する', () => {
      const formData: ApprovalForm = {
        title: 'New Title',
        approver: 'new@example.com',
        amount: 5000,
      };
      const result = editApprovalRequest('APR-001', formData);

      expect(mockSheet.getRange).toHaveBeenCalledWith(2, 2); // Title column
      expect(mockRange.setValue).toHaveBeenCalledWith('New Title');
      expect(mailer.sendApprovalNotification_).toHaveBeenCalledWith(
        'new@example.com',
        expect.stringContaining('【稟議更新】'),
        expect.any(String),
        { cc: 'user@example.com' },
      );
      expect(result).toBe('稟議申請が正常に更新されました。');
    });

    it('権限のないユーザーが編集しようとするとエラーをスローする', () => {
      expect(() => editApprovalRequest('APR-002', {} as any)).toThrow(
        'この稟議を編集する権限がありません。',
      );
    });

    it('未承認でない稟議を編集しようとするとエラーをスローする', () => {
      expect(() => editApprovalRequest('APR-003', {} as any)).toThrow(
        'この稟議は未承認状態ではないため、編集できません。',
      );
    });

    it('IDが見つからない場合にエラーをスローする', () => {
      expect(() => editApprovalRequest('APR-999', {} as any)).toThrow(
        '指定されたIDの稟議申請が見つかりません。',
      );
    });

    it('シートが見つからない場合にエラーをスローする', () => {
      mockSpreadsheet.getSheetByName.mockReturnValue(null);
      expect(() => editApprovalRequest('APR-001', {} as any)).toThrow(
        'DBシート「WF｜Requests」が見つかりません',
      );
    });
  });

  describe('getApprovalRequests', () => {
    it('関連する稟議申請を取得し、JSON文字列で返す', () => {
      const mockData = [
        ['ID', 'Title', 'Applicant', 'Approver', 'Status', 'CreatedAt'],
        [
          'APR-002', // 新しいものが上に来るようにソートされることを確認
          'Req 2',
          'other@example.com',
          'user@example.com',
          'approved',
          new Date('2023-01-02').toISOString(),
        ],
        [
          'APR-001',
          'Req 1',
          'user@example.com',
          'other@example.com',
          'pending',
          new Date('2023-01-01').toISOString(),
        ],
        [
          'APR-003',
          'Req 3',
          'other@example.com',
          'another@example.com',
          'pending',
          new Date('2023-01-03').toISOString(),
        ],
      ];
      mockSheet.getDataRange.mockReturnValue({
        getValues: () => mockData,
      } as GoogleAppsScript.Spreadsheet.Range);

      const result = JSON.parse(getApprovalRequests(10, 0));

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      // 日付でソートされているため、APR-002が先頭に来る
      expect(result.data[0].id).toBe('APR-002');
      expect(result.data[1].id).toBe('APR-001');
    });

    it('データがヘッダーのみの場合に空の配列を返す', () => {
      const mockData = [
        ['ID', 'Title', 'Applicant', 'Approver', 'Status', 'CreatedAt'],
      ];
      mockSheet.getDataRange.mockReturnValue({
        getValues: () => mockData,
      } as GoogleAppsScript.Spreadsheet.Range);
      const result = JSON.parse(getApprovalRequests(10, 0));
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('シートが見つからない場合にエラーをスローする', () => {
      mockSpreadsheet.getSheetByName.mockReturnValue(null);
      expect(() => getApprovalRequests(10, 0)).toThrow(
        'DBシート「WF｜Requests」が見つかりません',
      );
    });
  });

  describe('updateApprovalStatus', () => {
    const mockData = [
      ['ID', 'Title', 'Applicant', 'Approver', 'Status'],
      [
        'APR-001',
        'Req 1',
        'applicant@example.com',
        'user@example.com',
        'pending',
      ],
    ];
    const mockRange = {
      setValues: vi.fn(),
    } as unknown as GoogleAppsScript.Spreadsheet.Range;

    beforeEach(() => {
      mockSheet.getDataRange.mockReturnValue({
        getValues: () => mockData,
      } as GoogleAppsScript.Spreadsheet.Range);
      mockSheet.getRange.mockReturnValue(mockRange);
      global.Session = {
        getActiveUser: () => ({ getEmail: () => 'user@example.com' }),
      } as any;
    });

    it('ステータスを承認に更新し、メールを送信する', () => {
      updateApprovalStatus('APR-001', 'approved', undefined, 'Looks good');
      expect(mockRange.setValues).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.arrayContaining(['approved', '', 'Looks good']),
        ]),
      );
      expect(mailer.sendApprovalNotification_).toHaveBeenCalledWith(
        'applicant@example.com',
        expect.stringContaining('【稟議承認】'),
        expect.stringContaining('Looks good'),
        { cc: 'user@example.com' },
      );
    });

    it('ステータスを却下に更新し、メールを送信する', () => {
      updateApprovalStatus('APR-001', 'rejected', 'Not approved', undefined);
      expect(mockRange.setValues).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.arrayContaining(['rejected', 'Not approved', '']),
        ]),
      );
      expect(mailer.sendApprovalNotification_).toHaveBeenCalledWith(
        'applicant@example.com',
        expect.stringContaining('【稟議却下】'),
        expect.stringContaining('Not approved'),
        { cc: 'user@example.com' },
      );
    });

    it('権限のないユーザーが更新しようとするとエラーをスローする', () => {
      global.Session = {
        getActiveUser: () => ({ getEmail: () => 'another@example.com' }),
      } as any;
      expect(() => updateApprovalStatus('APR-001', 'approved')).toThrow(
        'この稟議を承認・却下する権限がありません。',
      );
    });

    it('IDが見つからない場合にエラーをスローする', () => {
      expect(() => updateApprovalStatus('APR-999', 'approved')).toThrow(
        '指定されたIDの稟議申請が見つかりません。',
      );
    });

    it('シートが見つからない場合にエラーをスローする', () => {
      mockSpreadsheet.getSheetByName.mockReturnValue(null);
      expect(() => updateApprovalStatus('APR-001', 'approved')).toThrow(
        'DBシート「WF｜Requests」が見つかりません',
      );
    });
  });

  describe('withdrawApprovalRequest', () => {
    const mockData = [
      ['ID', 'Title', 'Applicant', 'Approver', 'Status'],
      [
        'APR-001',
        'Req 1',
        'user@example.com',
        'approver@example.com',
        'pending',
      ],
    ];
    const mockRange = {
      setValues: vi.fn(),
    } as unknown as GoogleAppsScript.Spreadsheet.Range;

    beforeEach(() => {
      mockSheet.getDataRange.mockReturnValue({
        getValues: () => mockData,
      } as GoogleAppsScript.Spreadsheet.Range);
      mockSheet.getRange.mockReturnValue(mockRange);
      global.Session = {
        getActiveUser: () => ({ getEmail: () => 'user@example.com' }),
      } as any;
    });

    it('申請を取り下げ、メールを送信する', () => {
      withdrawApprovalRequest('APR-001');
      expect(mockRange.setValues).toHaveBeenCalledWith(
        expect.arrayContaining([expect.arrayContaining(['withdrawn'])]),
      );
      expect(mailer.sendApprovalNotification_).toHaveBeenCalledWith(
        'approver@example.com',
        expect.stringContaining('【稟議取り下げ】'),
        expect.any(String),
        { cc: 'user@example.com' },
      );
    });

    it('権限のないユーザーが取り下げようとするとエラーをスローする', () => {
      global.Session = {
        getActiveUser: () => ({ getEmail: () => 'another@example.com' }),
      } as any;
      expect(() => withdrawApprovalRequest('APR-001')).toThrow(
        'この稟議を取り下げる権限がありません。',
      );
    });

    it('IDが見つからない場合にエラーをスローする', () => {
      expect(() => withdrawApprovalRequest('APR-999')).toThrow(
        '指定されたIDの稟議申請が見つかりません。',
      );
    });

    it('シートが見つからない場合にエラーをスローする', () => {
      mockSpreadsheet.getSheetByName.mockReturnValue(null);
      expect(() => withdrawApprovalRequest('APR-001')).toThrow(
        'DBシート「WF｜Requests」が見つかりません',
      );
    });
  });
});
