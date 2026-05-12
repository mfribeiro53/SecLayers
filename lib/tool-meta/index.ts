export type { ToolHelp, ToolMeta } from "./types";

import { foundationsMeta } from "./foundations";
import { webMeta } from "./web";
import { apiMeta } from "./api";
import { mobileMeta } from "./mobile";
import { systemsMeta } from "./systems";
import { cloudMeta } from "./cloud";
import { supplyChainMeta } from "./supply-chain";
import type { ToolMeta } from "./types";

export const TOOL_META: Record<string, ToolMeta> = {
  ...foundationsMeta,
  ...webMeta,
  ...apiMeta,
  ...mobileMeta,
  ...systemsMeta,
  ...cloudMeta,
  ...supplyChainMeta,
};
