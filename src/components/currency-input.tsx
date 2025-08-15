import * as React from 'react';
import { cn } from '@/lib/utils';

export const parseCurrencyValue = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return Number(digits);
};

export const formatCurrencyValue = (value: string) => {
  const moneyFormatter = new Intl.NumberFormat('ja-JP', {
    currency: 'JPY',
    style: 'currency',
  });
  const numberValue = parseCurrencyValue(value);
  return moneyFormatter.format(numberValue);
};

export function CurrencyInput({
  className,
  type,
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<'input'>) {
  const initialValue = formatCurrencyValue(
    defaultValue ? defaultValue.toString() : '0',
  );

  const [value, setValue] = React.useReducer((_, next: string) => {
    return formatCurrencyValue(next);
  }, initialValue);

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
      onChange={(event) => {
        setValue(event.target.value);
        onChange?.(event);
      }}
      value={value}
    />
  );
}
