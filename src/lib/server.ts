import {
  getPromisedServerScripts,
  type PartialScriptType,
} from '@ciderjs/gasnuki/promise';
import { parameters } from '@/lib/parameters';
import type { ApprovalRequest } from '~/types/approval';
import type { ServerScripts } from '~/types/appsscript/client';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ローカル開発時にGASバックエンドの処理をモックするための仮実装です。
const mockApprovalRequests: ApprovalRequest[] = Array.from(
  { length: 25 },
  (_, i) => ({
    id: `MOCK-${i + 1}`,
    title: `モック用稟議 ${i + 1}`,
    applicant:
      i % 3 === 0 ? parameters.userAddress : `mock-user${i}@example.com`,
    approver:
      i % 2 === 0 ? parameters.userAddress : `mock-approver${i}@example.com`,
    status: ['pending', 'approved', 'rejected', 'withdrawn'][
      i % 4
    ] as ApprovalRequest['status'],
    amount: (i + 1) * 10000,
    description: `これはモック用の稟議申請 No.${i + 1} の説明文です。\nhttps://example.com/${i + 1}`,
    benefits: 'テスト効率化',
    avoidableRisks: '予期せぬバグ',
    createdAt: Utilities.formatDate(
      new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      'JST',
      'yyyy/MM/dd HH:mm:ss',
    ),
    approvedAt:
      i % 4 === 1
        ? Utilities.formatDate(
            new Date(Date.now() - (i - 1) * 24 * 60 * 60 * 1000),
            'JST',
            'yyyy/MM/dd HH:mm:ss',
          )
        : undefined,
    approverComment: i % 4 === 1 ? '承認します。' : undefined,
  }),
);

const mockup: PartialScriptType<ServerScripts> = {
  createApprovalRequest: async (formData) => {
    console.log('Mock: createApprovalRequest called with', formData);
    await sleep(1000 * 1.5);
    const newRequest: ApprovalRequest = {
      id: `MOCK-${mockApprovalRequests.length + 1}`,
      ...formData,
      applicant: parameters.userAddress,
      status: 'pending',
      createdAt: Utilities.formatDate(
        new Date(Date.now()),
        'JST',
        'yyyy/MM/dd HH:mm:ss',
      ),
    };
    mockApprovalRequests.unshift(newRequest); // 先頭に追加
    return 'Mock: 稟議申請が正常に作成されました。';
  },
  getApprovalRequests: async (limit = 10, offset = 0) => {
    console.log('Mock: getApprovalRequests called with', { limit, offset });
    await sleep(1000 * 1.5);
    const userEmail = parameters.userAddress;
    const filtered = mockApprovalRequests.filter(
      (req) => req.applicant === userEmail || req.approver === userEmail,
    );
    const data = filtered.slice(offset, offset + limit);
    const total = filtered.length;
    return JSON.stringify({ data, total });
  },
  updateApprovalStatus: async (id, newStatus, reason, approverComment) => {
    console.log(`Mock: updateApprovalStatus called for ${id} to ${newStatus}`);
    await sleep(1000 * 1.5);
    const request = mockApprovalRequests.find((req) => req.id === id);
    if (request && request.approver === parameters.userAddress) {
      request.status = newStatus;
      request.approvedAt = Utilities.formatDate(
        new Date(),
        'JST',
        'yyyy/MM/dd HH:mm:ss',
      );
      request.rejectionReason = reason;
      request.approverComment = approverComment;
      return `Mock: 稟議申請ID: ${id} のステータスが ${newStatus} に更新されました。`;
    }
    throw new Error('Mock: 稟議申請が見つからないか、権限がありません。');
  },
  withdrawApprovalRequest: async (id) => {
    console.log(`Mock: withdrawApprovalRequest called for ${id}`);
    await sleep(1000 * 1.5);
    const request = mockApprovalRequests.find((req) => req.id === id);
    if (request && request.applicant === parameters.userAddress) {
      request.status = 'withdrawn';
      return `Mock: 稟議申請ID: ${id} が正常に取り下げられました。`;
    }
    throw new Error('Mock: 稟議申請が見つからないか、権限がありません。');
  },
  getApprovers: async (limit) => {
    console.log(`Mock: getApprovers called with ${limit}`);
    await sleep(1000 * 1.5);
    await sleep(1000 * 1.5);
    const userEmail = parameters.userAddress;
    const filtered = mockApprovalRequests
      .filter(
        (req) => req.applicant === userEmail || req.approver === userEmail,
      )
      .sort((rowA, rowB) => {
        return (
          new Date(rowB.createdAt).getTime() -
          new Date(rowA.createdAt).getTime()
        );
      });
    const data = filtered.slice(0, limit);
    const approvers = [...new Set(data.map((req) => req.approver))].sort();
    return JSON.stringify(approvers);
  },
};

// getPromisedServerScripts を使用して、Promiseを返す型安全なサーバー関数ラッパーを生成します。
// ローカル開発時（google.script.run が undefined の場合）は `mockup` の関数が使われます。
// GAS環境（google.script.run が利用可能な場合）は実際のGAS関数が呼び出されます。
export const serverScripts = getPromisedServerScripts<ServerScripts>(mockup);
