// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

import { readJson, writeJson, deleteFile } from "../lib/storage";
import { getCurrentTimestamp } from "../lib/utils";

// ============================================================================
// SECTION: Session Persistence
// ============================================================================

const SESSION_FILE = ".current_mission";

interface SessionData {
  mission: string;
  attachedAt: string;
}

export async function getCurrentMission(cwdAbsolute: string): Promise<SessionData | null> {
  const path = `${cwdAbsolute}/loot/${SESSION_FILE}`;
  return readJson<SessionData>(path);
}

export async function setCurrentMission(mission: string, cwdAbsolute: string): Promise<void> {
  const path = `${cwdAbsolute}/loot/${SESSION_FILE}`;
  const sessionData: SessionData = {
    mission,
    attachedAt: getCurrentTimestamp()
  };
  await writeJson(path, sessionData);
}

export async function clearCurrentMission(cwdAbsolute: string): Promise<void> {
  const path = `${cwdAbsolute}/loot/${SESSION_FILE}`;
  await deleteFile(path);
}
