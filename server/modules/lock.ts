/**
 * スクリプトロックを取得し、コールバックを排他制御下で実行するユーティリティ関数。
 *
 * @param callback 排他制御下で実行したい関数
 * @returns なし
 */
export function useLock(callback: () => void) {
  const lockService = LockService.getScriptLock();
  try {
    while (!lockService.hasLock()) {
      Utilities.sleep(10);
    }
    callback();
  } finally {
    lockService.releaseLock();
  }
}
