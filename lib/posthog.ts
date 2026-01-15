import { PostHog } from "posthog-node";

// NOTE: This is a Node.js client, so you can use it for sending events from the server side to PostHog.
export default function PostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn('PostHog key not found in environment variables')
    return null
  }

  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}

export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  const client = PostHogClient()
  if (client) {
    client.capture({
      distinctId,
      event,
      properties,
    })
  }
}