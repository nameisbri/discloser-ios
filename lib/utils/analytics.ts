import { logger } from "./logger";

interface ResourceTapEvent {
  resource_id: string;
  category: string;
  region: string;
  timestamp: string;
}

const MAX_EVENT_LOG_SIZE = 1000;
const eventLog: ResourceTapEvent[] = [];

export function trackResourceTap(resourceId: string, category: string, region: string): void {
  const event: ResourceTapEvent = {
    resource_id: resourceId,
    category,
    region,
    timestamp: new Date().toISOString(),
  };

  if (eventLog.length >= MAX_EVENT_LOG_SIZE) {
    eventLog.shift();
  }
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
