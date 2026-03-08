import type { SessionUser } from "@/models";
import { createId } from "@/lib/utils/ids";
import { userColor } from "@/lib/utils/colors";

export function createLocalSessionUser(displayName: string): SessionUser {
  const userId = createId("usr");
  const color = userColor(userId);

  return {
    userId,
    displayName: displayName.trim(),
    color
  };
}