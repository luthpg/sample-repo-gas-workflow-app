import { Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ローディングスピナーコンポーネント
 */
export function Loader({ className }: { className?: string }) {
  return (
    <Loader2Icon
      className={cn('animate-spin', className)}
      data-testid="loader"
    />
  );
}
