import * as React from 'react';
import { cn } from '@/lib/utils';

// 数値以外の文字を削除
export const parseCurrencyValue = (value: string | number) => {
  const digits = String(value).replace(/\D/g, '');
  return Number(digits);
};

// 通貨形式にフォーマット
export const formatCurrencyValue = (value: string | number) => {
  const moneyFormatter = new Intl.NumberFormat('ja-JP', {
    currency: 'JPY',
    style: 'currency',
  });
  const numberValue = parseCurrencyValue(value);
  return moneyFormatter.format(numberValue);
};

export function CurrencyInput({
  className,
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<'input'>) {
  const [isComposing, setIsComposing] = React.useState(false);
  const [value, setValue] = React.useState(() =>
    formatCurrencyValue(defaultValue ? String(defaultValue) : '0'),
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // IME入力中でなければフォーマット
    if (!isComposing) {
      const formattedValue = formatCurrencyValue(e.target.value);
      setValue(formattedValue);
      // react-hook-formに数値を渡すための処理
      e.target.value = String(parseCurrencyValue(formattedValue));
      onChange?.(e);
    } else {
      // IME入力中はそのままの値をセット
      setValue(e.target.value);
    }
  };

  return (
    <input
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={(e: React.CompositionEvent<HTMLInputElement>) => {
        setIsComposing(false);
        // 変換確定後にフォーマット
        const formattedValue = formatCurrencyValue(
          (e.target as HTMLInputElement).value,
        );
        setValue(formattedValue);
        // react-hook-formに数値を渡すための処理
        const event = {
          target: { value: String(parseCurrencyValue(formattedValue)) },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(event);
      }}
    />
  );
}
