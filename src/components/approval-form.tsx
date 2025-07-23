import { zodResolver } from '@hookform/resolvers/zod';
import type * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { serverScripts } from '@/lib/server';
import type { ApiResponse, ApprovalRequest } from '../../types/approval';

// フォームのスキーマ定義
const formSchema = z.object({
  title: z
    .string()
    .min(1, { message: '件名は必須です' })
    .max(100, { message: '件名は100文字以内です' }),
  description: z
    .string()
    .min(1, { message: '説明は必須です' })
    .max(500, { message: '説明は500文字以内です' }),
  amount: z.number().min(0, { message: '金額は0以上である必要があります' }),
  benefits: z
    .string()
    .min(1, { message: 'メリットは必須です' })
    .max(500, { message: 'メリットは500文字以内です' }),
  avoidableRisks: z
    .string()
    .min(1, { message: '回避可能なリスクは必須です' })
    .max(500, { message: '回避可能なリスクは500文字以内です' }),
  applicant: z.string().min(1, { message: '申請者は必須です' }),
});

type ApprovalFormValues = z.infer<typeof formSchema>;

interface ApprovalFormProps {
  onSubmitSuccess: (newRequest: ApprovalRequest) => void;
}

const ApprovalForm: React.FC<ApprovalFormProps> = ({ onSubmitSuccess }) => {
  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      amount: 0,
      benefits: '',
      avoidableRisks: '',
      applicant: '',
    },
  });

  const onSubmit = async (values: ApprovalFormValues) => {
    try {
      // GASバックエンドに申請データを送信する関数を呼び出す
      // google.script.run のラッパー `serverScripts` の型は gasnuki で自動生成されるため、型安全に呼び出せる
      let response: string;
      try {
        response = await serverScripts.createApprovalRequest(values);
      } catch (error) {
        form.setError('root', {
          message: `申請に失敗しました: ${(error as Error).message}`,
        });
        return;
      }
      const result: ApiResponse<ApprovalRequest> = JSON.parse(response);

      if (result.success && result.data) {
        onSubmitSuccess(result.data);
        form.reset();
      } else {
        form.setError('root', {
          message: result.error || '不明なエラーが発生しました',
        });
      }
    } catch (error) {
      console.error('フォーム送信エラー:', error);
      form.setError('root', { message: '予期せぬエラーが発生しました' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>件名</FormLabel>
              <FormControl>
                <Input placeholder="稟議の件名" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>説明</FormLabel>
              <FormControl>
                <Textarea placeholder="詳細な説明" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>金額</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="金額"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>購買対象のメリット</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="この購買によるメリットを具体的に記述してください"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avoidableRisks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>回避可能なリスク</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="この購買により回避できるリスクや、導入しないことによるリスクを記述してください"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="applicant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>申請者</FormLabel>
              <FormControl>
                <Input placeholder="あなたの名前" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? '申請中...' : '申請する'}
        </Button>
      </form>
    </Form>
  );
};

export default ApprovalForm;
