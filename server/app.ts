import type { ServerParams, WebAppParams } from '~/types/appsscript/server';

export * from './modules/db';

/**
 * Webアプリとして公開された際にGETリクエストを処理する関数
 * この関数は、ViteでビルドされたフロントエンドのHTMLを返します
 */
export function doGet(e: WebAppParams) {
  const htmlTemplate = HtmlService.createTemplateFromFile('index');
  const title = '稟議App';
  const userAddress = Session.getActiveUser().getEmail();
  htmlTemplate.parameter = JSON.stringify({
    ...e,
    siteTitle: title,
    userAddress: userAddress,
  } satisfies ServerParams);
  const htmlOutput = htmlTemplate.evaluate();
  htmlOutput.setTitle(title);
  htmlOutput.addMetaTag(
    'viewport',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimal-ui',
  );
  return htmlOutput;
}
