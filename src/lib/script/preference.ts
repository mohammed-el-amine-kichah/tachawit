import { parseChoice } from "@/lib/choice";
import { defaultScript, scripts, type Script } from "./scripts";

export const SCRIPT_COOKIE = "tachawit-script";

export function parseScriptPreference(value: string | null | undefined): Script {
  return parseChoice(value, scripts, defaultScript);
}
