import {
  getPromisedServerScripts,
  type PartialScriptType,
} from '@ciderjs/gasnuki/promise';
import type { ServerScripts } from '@/../types/appsscript';

const mockup: PartialScriptType<ServerScripts> = {};

export const serverScripts = getPromisedServerScripts<ServerScripts>(mockup);
