import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { type FieldValues, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { CurrencyInput, parseCurrencyValue } from '@/components/currency-input';
import { Loader } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { serverScripts } from '@/lib/server';
import type { ApprovalForm as ApprovalFormType } from '~/types/approval';

// フォームのバリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(2, {
    message: 'タイトルは2文字以上で入力してください。',
  }),
  amount: z.preprocess(
    (v: string) => {
      return parseCurrencyValue(v);
    },
    z.coerce
      .number<number>()
      .min(0, { message: '金額は0以上で入力してください。' }),
  ),
  description: z.string().optional(),
  benefits: z.string().optional(),
  avoidableRisks: z.string().optional(),
  approver: z.email({
    message: '有効なメールアドレスを入力してください。',
  }),
});

export function ApprovalForm({
  onFormSubmitSuccess,
}: {
  onFormSubmitSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<FieldValues, unknown, ApprovalFormType>({
    resolver: zodResolver<FieldValues, unknown, ApprovalFormType>(formSchema),
    defaultValues: {
      title: '',
      amount: 0,
      description: '',
      benefits: '',
      avoidableRisks: '',
      approver: '',
    },
  });

  // フォーム送信時の処理
  async function onSubmit(values: ApprovalFormType) {
    setIsSubmitting(true);
    try {
      await serverScripts.createApprovalRequest(values);
      toast.success('申請成功', {
        description: '稟議申請が正常に送信されました。',
      });
      form.reset();
      setOpen(false);
      onFormSubmitSuccess();
    } catch (error) {
      toast.error('申請失敗', {
        description: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-sm">
          {isMobile ? (
            <PlusCircle className="h-4 w-4" />
          ) : (
            <>
              <PlusCircle className="h-4 w-4" /> 新規申請
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規稟議申請</DialogTitle>
          <DialogDescription>
            新しい稟議申請フォームに必要事項を入力してください。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル</FormLabel>
                  <FormControl>
                    <Input placeholder="稟議タイトル" {...field} />
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
                    <CurrencyInput {...field} />
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
                    <Textarea
                      placeholder="対象のURL、説明書きなど…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="approver"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>承認者メールアドレス</FormLabel>
                  <FormControl>
                    <Input placeholder="approver@example.com" {...field} />
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
                  <FormLabel>導入によるメリット</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="メリットを具体的に記述してください"
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
                  <FormLabel>懸念されるリスク</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="考えられるリスクと回避策"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader className="mr-2 h-4 w-4" />}
              申請する
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
