import {
  getPromisedServerScripts,
  type PartialScriptType,
} from '@ciderjs/gasnuki/promise';
import dayjs from 'dayjs';
import type { ApiResponse, ApprovalRequest } from '../../types/approval';
import type { EmbeddedParameters, ServerScripts } from '../../types/appsscript';

const sleep = async (sec: number) =>
  new Promise((resolve) => setTimeout(resolve, sec));

const mockup: PartialScriptType<ServerScripts> = {
  async createApprovalRequest(requestData) {
    await sleep(1.5);
    return JSON.stringify({
      success: true,
      data: {
        id: `APR-test-${dayjs().format('YYYYMMDDHHmmss')}`,
        title: requestData.title,
        description: requestData.description,
        amount: requestData.amount,
        benefits: requestData.benefits,
        avoidableRisks: requestData.avoidableRisks,
        applicant: requestData.applicant,
        status: 'pending',
        createdAt: dayjs().format('YYYY/MM/DD HH:mm:ss'),
      },
    } as ApiResponse<ApprovalRequest>);
  },
  async updateApprovalStatus(id, status, reason) {
    await sleep(1.5);
    return JSON.stringify({
      success: true,
      data: {
        id,
        status,
        ...(reason && { rejectionReason: reason }),
        ...(status === 'approved' && { approvedAt: dayjs().format() }),
      },
    } as ApiResponse<ApprovalRequest>);
  },
};

export const serverScripts = getPromisedServerScripts<ServerScripts>(mockup);

const getEmbeddedParameters = (): EmbeddedParameters => {
  let parameters: EmbeddedParameters = {} as EmbeddedParameters;
  try {
    const parametersJSON = '<?!= JSON.stringify(parameters); ?>';
    parameters = JSON.parse(
      parametersJSON.slice(1, parametersJSON.length - 1).replace(/\\"/g, '"'),
    );
  } catch {
    // parameters mockups
    const url = new URL(window.location.href);
    parameters = {
      ...parameters,
      parameter: {
        id: url.searchParams.get('id') || undefined,
        page: url.searchParams.get('page') || 'dashboard',
      },
      userAddress: 'test.user01@example.com',
    };
  }
  return parameters;
};

export const embeddedParameters = getEmbeddedParameters();

export const handleOnChangePage = (page: string) => {
  'google' in window
    ? google.script.history.replace({}, { ...embeddedParameters, page }, '')
    : window.history.replaceState(
        {
          ...window.history.state,
          as: `/?page=${page}`,
          url: `/?page=${page}`,
        },
        '',
        `/?page=${page}`,
      );
};
