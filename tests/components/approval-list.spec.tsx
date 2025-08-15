import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { ApprovalList } from '@/components/approval-list';
import { Toaster } from '@/components/ui/sonner';
import { parameters } from '@/lib/parameters';
import { serverScripts } from '@/lib/server';
import type { ApprovalRequest } from '~/types/approval';

const mockedServerScripts = serverScripts as {
  [K in keyof typeof serverScripts]: Mock;
};

const mockRequests: ApprovalRequest[] = [
  {
    id: 'APR-001',
    title: 'PC購入申請',
    applicant: 'applicant@example.com',
    approver: 'approver@example.com',
    status: 'pending',
    amount: 150000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'APR-002',
    title: '書籍購入申請',
    applicant: 'approver@example.com',
    approver: 'applicant@example.com',
    status: 'approved',
    amount: 5000,
    createdAt: new Date().toISOString(),
  },
];

describe('ApprovalList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parameters.userAddress = 'applicant@example.com';
  });

  it('ローディング中にスピナーが表示される', () => {
    mockedServerScripts.getApprovalRequests.mockReturnValue(
      new Promise(() => {}),
    );
    render(<ApprovalList />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('データ取得成功時にリストが表示される', async () => {
    mockedServerScripts.getApprovalRequests.mockResolvedValue(
      JSON.stringify({ data: mockRequests, total: 2 }),
    );
    render(<ApprovalList />);
    await waitFor(() => {
      expect(screen.getByText('PC購入申請')).toBeInTheDocument();
      expect(screen.getByText('書籍購入申請')).toBeInTheDocument();
    });
  });

  it('データがない場合にメッセージが表示される', async () => {
    mockedServerScripts.getApprovalRequests.mockResolvedValue(
      JSON.stringify({ data: [], total: 0 }),
    );
    render(<ApprovalList />);
    await waitFor(() => {
      expect(
        screen.getByText('表示する稟議申請はありません。'),
      ).toBeInTheDocument();
    });
  });

  it('データ取得失敗時にエラーが表示される', async () => {
    mockedServerScripts.getApprovalRequests.mockRejectedValue(
      new Error('Fetch Error'),
    );
    render(
      <>
        <ApprovalList />
        <Toaster />
      </>,
    );
    expect(await screen.findByText('データ取得エラー')).toBeInTheDocument();
  });

  it('詳細ボタンクリックでダイアログが表示される', async () => {
    mockedServerScripts.getApprovalRequests.mockResolvedValue(
      JSON.stringify({ data: [mockRequests[0]], total: 1 }),
    );
    render(<ApprovalList />);
    const detailButton = await screen.findByRole('button', { name: '詳細' });
    await userEvent.click(detailButton);

    expect(
      await screen.findByRole('heading', { name: /稟議詳細: PC購入申請/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('applicant@example.com', { selector: 'p' }),
    ).toBeInTheDocument();
  });

  it('承認者が承認・却下ボタンをクリックできる', async () => {
    parameters.userAddress = 'approver@example.com';
    mockedServerScripts.getApprovalRequests.mockResolvedValue(
      JSON.stringify({ data: [mockRequests[0]], total: 1 }),
    );
    mockedServerScripts.updateApprovalStatus.mockResolvedValue('Success');

    render(
      <>
        <ApprovalList />
        <Toaster />
      </>,
    );

    await userEvent.click(await screen.findByRole('button', { name: '詳細' }));

    const dialog = await screen.findByRole('dialog');
    const approveButton = within(dialog).getByRole('button', { name: '承認' });
    const rejectButton = within(dialog).getByRole('button', { name: '却下' });

    expect(approveButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();

    await userEvent.click(approveButton);

    const approveDialog = await screen.findByRole('dialog', {
      name: /稟議を承認/i,
    });
    await userEvent.type(
      within(approveDialog).getByPlaceholderText('承認コメント'),
      '承認します',
    );
    await userEvent.click(
      within(approveDialog).getByRole('button', { name: '承認する' }),
    );

    await waitFor(() => {
      expect(mockedServerScripts.updateApprovalStatus).toHaveBeenCalledWith(
        'APR-001',
        'approved',
        undefined,
        '承認します',
      );
      expect(screen.getByText('更新成功')).toBeInTheDocument();
    });
  });

  it('申請者が取り下げボタンをクリックできる', async () => {
    parameters.userAddress = 'applicant@example.com';
    mockedServerScripts.getApprovalRequests.mockResolvedValue(
      JSON.stringify({ data: [mockRequests[0]], total: 1 }),
    );
    mockedServerScripts.withdrawApprovalRequest.mockResolvedValue('Success');

    render(
      <>
        <ApprovalList />
        <Toaster />
      </>,
    );

    await userEvent.click(await screen.findByRole('button', { name: '詳細' }));

    const dialog = await screen.findByRole('dialog');
    const withdrawButton = within(dialog).getByRole('button', {
      name: '取り下げ',
    });
    await userEvent.click(withdrawButton);

    await waitFor(() => {
      expect(mockedServerScripts.withdrawApprovalRequest).toHaveBeenCalledWith(
        'APR-001',
      );
      expect(screen.getByText('取り下げ成功')).toBeInTheDocument();
    });
  });

  it('ページネーションが機能する', async () => {
    const manyRequests = Array.from({ length: 15 }, (_, i) => ({
      ...mockRequests[0],
      id: `APR-${i}`,
    }));
    mockedServerScripts.getApprovalRequests.mockResolvedValue(
      JSON.stringify({ data: manyRequests.slice(0, 10), total: 15 }),
    );
    render(<ApprovalList />);

    await waitFor(() => {
      expect(screen.getByText('15件中 1 - 10件を表示')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: '次へ' });
    mockedServerScripts.getApprovalRequests.mockResolvedValue(
      JSON.stringify({ data: manyRequests.slice(10, 15), total: 15 }),
    );
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(mockedServerScripts.getApprovalRequests).toHaveBeenCalledWith(
        10,
        10,
      );
      expect(screen.getByText('15件中 11 - 15件を表示')).toBeInTheDocument();
    });
  });
});
