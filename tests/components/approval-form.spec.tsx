import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { ApprovalForm } from '@/components/approval-form';
import { Toaster } from '@/components/ui/sonner';
import { serverScripts } from '@/lib/server';

// serverScriptsのモックを適切に型付け
const mockedServerScripts = serverScripts as {
  [K in keyof typeof serverScripts]: Mock;
};

describe('ApprovalForm', () => {
  const onFormSubmitSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('フォームが正しくレンダリングされる', async () => {
    render(<ApprovalForm onFormSubmitSuccess={onFormSubmitSuccess} />);
    await userEvent.click(screen.getByRole('button', { name: /新規申請/i }));

    expect(screen.getByLabelText(/タイトル/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/金額/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/説明/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/承認者メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/導入によるメリット/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/回避可能なリスク/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /申請する/i }),
    ).toBeInTheDocument();
  });

  it('有効なデータでフォームを送信すると成功する', async () => {
    mockedServerScripts.createApprovalRequest.mockResolvedValue('Success');
    render(
      <>
        <ApprovalForm onFormSubmitSuccess={onFormSubmitSuccess} />
        <Toaster />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: /新規申請/i }));

    await userEvent.type(screen.getByLabelText(/タイトル/i), 'Test Title');
    await userEvent.type(
      screen.getByLabelText(/承認者メールアドレス/i),
      'test@example.com',
    );
    await userEvent.click(screen.getByRole('button', { name: /申請する/i }));

    await waitFor(() => {
      expect(mockedServerScripts.createApprovalRequest).toHaveBeenCalledWith({
        title: 'Test Title',
        approver: 'test@example.com',
        amount: 0,
        description: '',
        benefits: '',
        avoidableRisks: '',
      });
      expect(onFormSubmitSuccess).toHaveBeenCalled();
      expect(screen.getByText('申請成功')).toBeInTheDocument();
    });
  });

  it('バリデーションエラーが表示される', async () => {
    render(<ApprovalForm onFormSubmitSuccess={onFormSubmitSuccess} />);
    await userEvent.click(screen.getByRole('button', { name: /新規申請/i }));
    await userEvent.click(screen.getByRole('button', { name: /申請する/i }));

    expect(
      await screen.findByText('タイトルは2文字以上で入力してください。'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('有効なメールアドレスを入力してください。'),
    ).toBeInTheDocument();
    expect(mockedServerScripts.createApprovalRequest).not.toHaveBeenCalled();
  });

  it('APIエラー時にエラーメッセージが表示される', async () => {
    mockedServerScripts.createApprovalRequest.mockRejectedValue(
      new Error('API Error'),
    );
    render(
      <>
        <ApprovalForm onFormSubmitSuccess={onFormSubmitSuccess} />
        <Toaster />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: /新規申請/i }));
    await userEvent.type(screen.getByLabelText(/タイトル/i), 'Test Title');
    await userEvent.type(
      screen.getByLabelText(/承認者メールアドレス/i),
      'test@example.com',
    );
    await userEvent.click(screen.getByRole('button', { name: /申請する/i }));

    expect(await screen.findByText('申請失敗')).toBeInTheDocument();
    expect(
      await screen.findByText('エラーが発生しました: API Error'),
    ).toBeInTheDocument();
  });
});
