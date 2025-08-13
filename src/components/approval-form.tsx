import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
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
  amount: z
    .number()
    .nonnegative({
      message: '金額は正の数で入力してください。',
    })
    .optional(),
  benefits: z.string().optional(),
  avoidableRisks: z.string().optional(),
  approver: z.email({
    message: '有効なメールアドレスを入力してください。',
  }),
});

export function ApprovalForm() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<ApprovalFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      amount: 0,
      benefits: '',
      avoidableRisks: '',
      approver: '',
    },
  });

  // フォーム送信時の処理
  async function onSubmit(values: ApprovalFormType) {
    try {
      await serverScripts.createApprovalRequest(values);
      toast.success('申請成功', {
        description: '稟議申請が正常に送信されました。',
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error('申請失敗', {
        description: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      });
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
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
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
                    <Input type="number" {...field} />
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
            <Button type="submit">申請する</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
