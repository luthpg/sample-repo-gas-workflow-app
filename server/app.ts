/**
 * Webアプリとして公開された際にGETリクエストを処理する関数
 * この関数は、ViteでビルドされたフロントエンドのHTMLを返します
 */
export function doGet() {
  // distディレクトリにあるindex.htmlファイルを読み込み、HTMLコンテンツとして返す
  return HtmlService.createTemplateFromFile('index').evaluate();
}

/**
 * ユーザー名を受け取り、挨拶メッセージを返すGAS関数
 * @param name ユーザーの名前
 * @returns 挨拶メッセージ
 */
export function sayHello(name: string): string {
  if (!name) {
    throw new Error('名前を入力してください');
  }
  return `こんにちは、${name}さん！GASからの挨拶です`;
}

/**
 * 現在時刻を文字列として返すGAS関数
 */
export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
