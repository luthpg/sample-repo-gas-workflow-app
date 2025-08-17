import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { serverScripts } from '@/lib/server';

export function ApproverInput(props: React.ComponentProps<'input'>) {
  const [approvers, setApprovers] = useState<string[]>([]);
  const datalistId = 'approvers-list';

  const fetchApprovers = async () => {
    try {
      const resultJson = await serverScripts.getApprovers(100);
      const result = JSON.parse(resultJson) as string[];
      setApprovers(result || []);
    } catch (error) {
      toast.error('承認者リスト取得エラー', {
        description: `過去の承認者リストの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: functions is not required
  useEffect(() => {
    fetchApprovers();
  }, []);

  return (
    <>
      <Input list={datalistId} {...props} />
      <datalist id={datalistId}>
        {approvers.map((approver) => (
          <option key={approver} value={approver} />
        ))}
      </datalist>
    </>
  );
}
