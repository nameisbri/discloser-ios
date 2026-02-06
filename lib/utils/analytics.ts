import { logger } from "./logger";

interface ResourceTapEvent {
  resource_id: string;
  category: string;
  region: string;
  timestamp: string;
}

const eventLog: ResourceTapEvent[] = [];

export function trackResourceTap(resourceId: string, category: string, region: string): void {
  const event: ResourceTapEvent = {
    resource_id: resourceId,
    category,
    region,
    timestamp: new Date().toISOString(),
  };

  eventLog.push(event);
  logger.info("resource_tap", event);
}

/** Exposed for testing */
export function getEventLog(): ResourceTapEvent[] {
  return [...eventLog];
}

/** Exposed for testing */
export function clearEventLog(): void {
  eventLog.length = 0;
}
