export interface WebAppParams<T extends string = string>
  extends GoogleAppsScript.Events.DoGet {
  parameter: Record<T, string>;
  parameters: Record<T, string[]>;
}

export type ServerParams = WebAppParams<'id'> & {
  siteTitle: string;
  userAddress: string;
};
