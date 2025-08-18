export type PostData = {
  length: number;
  /** mime type */
  type: string;
  contents: string;
  name: 'postData';
};

export interface WebAppParams<T extends string = string>
  extends GoogleAppsScript.Events.DoGet {
  parameter: Record<T, string>;
  parameters: Record<T, string[]>;
}

export type ServerParams = WebAppParams & {
  siteTitle: string;
  userAddress: string;
};
