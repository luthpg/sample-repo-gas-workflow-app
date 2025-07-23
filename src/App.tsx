import { ThemeProvider } from '@/components/theme-provider';
import { useState } from 'react';
import ApprovalForm from '@/components/approval-form';
import type { ApprovalRequest } from '@/../types/approval';

function App() {
  const [submittedRequests, setSubmittedRequests] = useState<ApprovalRequest[]>(
    [],
  ); // 申請済みリスト

  const handleApprovalFormSubmit = (newRequest: ApprovalRequest) => {
    setSubmittedRequests((prev) => [...prev, newRequest]);
    alert('稟議申請が送信されました！'); // 簡易的な通知
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">稟議アプリ</h1>

        {/* 稟議申請フォーム */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">稟議申請</h2>
          <ApprovalForm onSubmitSuccess={handleApprovalFormSubmit} />
        </div>

        {/* 申請済みリスト (簡易表示) */}
        {submittedRequests.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">申請済み稟議一覧</h2>
            <ul>
              {submittedRequests.map((req) => (
                <li key={req.id} className="mb-2 p-2 border rounded-md">
                  <p>
                    <strong>ID:</strong> {req.id}
                  </p>
                  <p>
                    <strong>件名:</strong> {req.title}
                  </p>
                  <p>
                    <strong>申請者:</strong> {req.applicant}
                  </p>
                  <p>
                    <strong>金額:</strong> {req.amount.toLocaleString()}円
                  </p>
                  <p>
                    <strong>メリット:</strong> {req.benefits}
                  </p>
                  <p>
                    <strong>回避可能なリスク:</strong> {req.avoidableRisks}
                  </p>
                  <p>
                    <strong>ステータス:</strong>{' '}
                    {req.status === 'pending' ? '承認待ち' : req.status}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
