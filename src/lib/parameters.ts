import type { ServerParams } from '~/types/appsscript/server';

let parameters: ServerParams = {} as ServerParams;

try {
  const parametersJson = '<?!= JSON.stringify(parameters) ?>';
  parameters = JSON.parse(
    parametersJson.slice(1, parametersJson.length - 1).replace(/\\"/g, '"'),
  );
} catch {
  parameters = {
    ...parameters,
    parameter: {},
    siteTitle: '',
    userAddress: 'mock-applicant@example.com',
  };
}

export { parameters };
