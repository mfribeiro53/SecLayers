import type { ToolMeta } from "./types";

export const prologueMeta: Record<string, ToolMeta> = {
  KillChainPlannerTool: {
    summary: "Choose a target scenario, select an attack technique at each of the 7 kill chain stages, then toggle defensive controls to see which chain links break.",
    quickStart: [
      "Pick one of the four target scenarios (web app, mobile, cloud, CI/CD)",
      "At each stage, read the three technique options and select one",
      "After stage 7, review your complete attack chain",
      "Toggle the five mitigations to see how many stages each defense breaks",
    ],
    help: {
      goal: "How a targeted attacker plans an operation end-to-end — and how defenders can break the chain at any stage to stop the attack.",
      steps: [
        "Select a scenario that matches a system type you want to understand",
        "At each kill chain stage, choose the technique that makes sense given your prior choices",
        "Notice which techniques leave the fewest traces and which are loudest",
        "In the results view, toggle each mitigation and observe which stages go green",
        "Try to build a set of defenses that breaks the chain as early as possible",
      ],
      lookFor: "A defense that breaks Reconnaissance or Weaponization stops the attack before any damage is done. A defense that only breaks Installation or C2 means exploitation already succeeded. Aim for early-chain controls (attack surface reduction, patching, credential hygiene) backed by late-chain detection (EDR, SIEM alerting).",
    },
  },
};
