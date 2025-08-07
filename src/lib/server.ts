import {
  getPromisedServerScripts,
  type PartialScriptType,
} from '@ciderjs/gasnuki/promise';
import type { ApprovalRequest } from '~/types/approval';
import type { ServerScripts } from '~/types/appsscript/client';

// ローカル開発時にGASバックエンドの処理をモックするための仮実装です。
// GASにデプロイすることなく、フロントエンドの挙動を確認できます。
const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: 'MOCK-001',
    title: 'モック用稟議A',
    applicant: 'applicant@example.com',
    approver: 'approver@example.com', // 承認者を指定
    status: 'pending',
    amount: 50000,
    benefits: 'テスト効率化',
    avoidableRisks: '予期せぬバグ',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    rejectionReason: null,
  },
  {
    id: 'MOCK-002',
    title: 'モック用稟議B',
    applicant: 'approver@example.com',
    approver: 'approver@example.com',
    status: 'approved',
    amount: 150000,
    benefits: '生産性向上',
    avoidableRisks: 'コスト増',
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    rejectionReason: null,
  },
];

const mockup: PartialScriptType<ServerScripts> = {
  createApprovalRequest: async (formData): Promise<string> => {
    console.log('Mock: createApprovalRequest called with', formData);
    const newRequest: ApprovalRequest = {
      id: `MOCK-${mockApprovalRequests.length + 1}`,
      ...formData,
      applicant: 'mock-applicant@example.com',
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      rejectionReason: null,
    };
    mockApprovalRequests.push(newRequest);
    return 'Mock: 稟議申請が正常に作成されました。';
  },
  getApprovalRequests: async (): Promise<ApprovalRequest[]> => {
    console.log('Mock: getApprovalRequests called');
    return mockApprovalRequests;
  },
  updateApprovalStatus: async (
    id: string,
    newStatus: 'approved' | 'rejected',
    reason?: string,
  ): Promise<string> => {
    console.log(`Mock: updateApprovalStatus called for ${id} to ${newStatus}`);
    const request = mockApprovalRequests.find((req) => req.id === id);
    if (request && request.approver === 'mock-approver@example.com') {
      // 承認者チェック
      request.status = newStatus;
      request.approvedAt = new Date().toISOString();
      request.rejectionReason = reason || null;
      return `Mock: 稟議申請ID: ${id} のステータスが ${newStatus} に更新されました。`;
    }
    throw new Error('Mock: 稟議申請が見つからないか、権限がありません。');
  },
};

// getPromisedServerScripts を使用して、Promiseを返す型安全なサーバー関数ラッパーを生成します。
// ローカル開発時（google.script.run が undefined の場合）は `mockup` の関数が使われます。
// GAS環境（google.script.run が利用可能な場合）は実際のGAS関数が呼び出されます。
export const serverScripts = getPromisedServerScripts<ServerScripts>(mockup);
