import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateEmailBody_,
  sendApprovalNotification_,
} from '../../server/modules/mailer';

const mockService = {
  getUrl: vi.fn(() => 'https://script.google.com/macros/s/SCRIPT_ID/exec'),
};

global.GmailApp = {
  sendEmail: vi.fn(),
} as any;
global.ScriptApp = {
  getService: () => mockService,
} as any;
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
};

describe('Mailer Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendApprovalNotification_', () => {
    it('正常にメールを送信する', () => {
      sendApprovalNotification_('to@example.com', 'Subject', 'Body', {
        cc: 'cc@example.com',
      });
      expect(GmailApp.sendEmail).toHaveBeenCalledWith(
        'to@example.com',
        'Subject',
        'Body',
        { cc: 'cc@example.com' },
      );
      expect(console.log).toHaveBeenCalledWith(
        'Email sent to to@example.com with subject: Subject',
      );
    });

    it('メール送信に失敗した場合にエラーをログに出力する', () => {
      const error = new Error('Send failed');
      (GmailApp.sendEmail as any).mockImplementation(() => {
        throw error;
      });
      sendApprovalNotification_('to@example.com', 'Subject', 'Body');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send email to to@example.com: Send failed',
      );
    });
  });

  describe('generateEmailBody_', () => {
    it('コメントなしでメール本文を生成する', () => {
      const request = {
        id: 'APR_001',
        title: 'Test Title',
        applicant: 'applicant@example.com',
        approver: 'approver@example.com',
        status: 'pending',
      };
      const body = generateEmailBody_(request);
      expect(body).toContain('タイトル: Test Title');
      expect(body).toContain(
        '対象URL: https://script.google.com/macros/s/SCRIPT_ID/exec?id=APR_001',
      );
      expect(body).not.toContain('承認者コメント');
    });

    it('コメントありでメール本文を生成する', () => {
      const request = {
        id: 'APR_001',
        title: 'Test Title',
        applicant: 'applicant@example.com',
        approver: 'approver@example.com',
        status: 'approved',
        comment: 'Looks good',
      };
      const body = generateEmailBody_(request);
      expect(body).toContain('承認者コメント: Looks good');
    });
  });
});
