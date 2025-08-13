import {
  getPromisedServerScripts,
  type PartialScriptType,
} from '@ciderjs/gasnuki/promise';
import { parameters } from '@/lib/parameters';
import type { ApprovalRequest } from '~/types/approval';
import type { ServerScripts } from '~/types/appsscript/client';

// ローカル開発時にGASバックエンドの処理をモックするための仮実装です。
const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: 'MOCK-001',
    title: 'モック用稟議A',
    applicant: parameters.userAddress,
    approver: 'mock-approver@example.com',
    status: 'pending',
    amount: 50000,
    description: '説明文\nhttps://google.com',
    benefits: 'テスト効率化',
    avoidableRisks: '予期せぬバグ',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'MOCK-002',
    title: 'モック用稟議B',
    applicant: 'mock-approver@example.com',
    approver: 'mock-approver@example.com',
    status: 'approved',
    amount: 150000,
    benefits: '生産性向上',
    avoidableRisks: 'コスト増',
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approverComment: '承認します。',
  },
  {
    id: 'MOCK-003',
    title: 'モック用稟議C',
    applicant: 'mock-approver@example.com',
    approver: parameters.userAddress,
    status: 'withdrawn',
    amount: 0,
    avoidableRisks: 'ストレス禿',
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
  },
];

const mockup: PartialScriptType<ServerScripts> = {
  createApprovalRequest: async (formData) => {
    console.log('Mock: createApprovalRequest called with', formData);
    const newRequest: ApprovalRequest = {
      id: `MOCK-${mockApprovalRequests.length + 1}`,
      ...formData,
      applicant: parameters.userAddress,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    mockApprovalRequests.push(newRequest);
    return 'Mock: 稟議申請が正常に作成されました。';
  },
  getApprovalRequests: async () => {
    console.log('Mock: getApprovalRequests called');
    return JSON.stringify(mockApprovalRequests);
  },
  updateApprovalStatus: async (id, newStatus, reason, approverComment) => {
    console.log(`Mock: updateApprovalStatus called for ${id} to ${newStatus}`);
    const request = mockApprovalRequests.find((req) => req.id === id);
    if (request && request.approver === parameters.userAddress) {
      request.status = newStatus;
      request.approvedAt = new Date().toISOString();
      request.rejectionReason = reason;
      request.approverComment = approverComment;
      return `Mock: 稟議申請ID: ${id} のステータスが ${newStatus} に更新されました。`;
    }
    throw new Error('Mock: 稟議申請が見つからないか、権限がありません。');
  },
  withdrawApprovalRequest: async (id) => {
    console.log(`Mock: withdrawApprovalRequest called for ${id}`);
    const request = mockApprovalRequests.find((req) => req.id === id);
    if (request && request.applicant === parameters.userAddress) {
      request.status = 'withdrawn';
      return `Mock: 稟議申請ID: ${id} が正常に取り下げられました。`;
    }
    throw new Error('Mock: 稟議申請が見つからないか、権限がありません。');
  },
};

// getPromisedServerScripts を使用して、Promiseを返す型安全なサーバー関数ラッパーを生成します。
// ローカル開発時（google.script.run が undefined の場合）は `mockup` の関数が使われます。
// GAS環境（google.script.run が利用可能な場合）は実際のGAS関数が呼び出されます。
export const serverScripts = getPromisedServerScripts<ServerScripts>(mockup);
