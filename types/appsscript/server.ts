export type PostData = {
  length: number;
  /** mime type */
  type: string;
  contents: string;
  name: 'postData';
};

export type WebAppParams<T extends string = string> = {
  queryString: string;
  parameter: Record<T, string>;
  parameters: Record<T, string[]>;
  contentLength: number;
  pathInfo?: string;
  contextPath: '';
  postData?: PostData;
};

export type ServerParams = WebAppParams & {
  siteTitle: string;
  userAddress: string;
};
