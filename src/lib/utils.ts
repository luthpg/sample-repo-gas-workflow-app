import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * メールアドレスから@以前の部分を名前として抽出する
 * @param email メールアドレス
 * @returns ユーザー名
 */
export function getUserNameFromEmail(email?: string | null) {
  if (!email) return '';
  return email.split('@')[0];
}
