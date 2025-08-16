/**
 * スクリプトロックを取得し、コールバックを排他制御下で実行するユーティリティ関数。
 *
 * @param callback 排他制御下で実行したい関数
 * @returns なし
 */
export function useLock_<T>(
  callback: () => T,
  coolTimeInMilliseconds = 100,
  timeoutInMilliseconds = 10000,
): T {
  const lockService = LockService.getScriptLock();
  let usedTime = 0;
  let returnValue: T;
  try {
    while (
      !lockService.tryLock(coolTimeInMilliseconds) ||
      usedTime <= timeoutInMilliseconds
    ) {
      usedTime += coolTimeInMilliseconds;
    }
    if (!lockService.hasLock()) {
      throw new Error('timeout');
    }
    returnValue = callback();
  } finally {
    lockService.releaseLock();
  }
  return returnValue;
}
