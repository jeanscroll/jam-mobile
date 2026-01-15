import React, { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface PostHogTrackerProps {
  eventName?: string
  properties?: Record<string, any>
  userId?: string
  userProperties?: Record<string, any>
  triggerOnMount?: boolean
  className?: string
  children?: React.ReactNode
}

export function PostHogTracker({
  eventName,
  properties,
  userId,
  userProperties,
  triggerOnMount = false,
  className,
  children,
}: PostHogTrackerProps) {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return

    if (userId) {
      posthog.identify(userId, userProperties)
    }

    if (userProperties && !userId) {
      posthog.setPersonProperties(userProperties)
    }

    if (triggerOnMount && eventName) {
      posthog.capture(eventName, properties)
    }
  }, [posthog, userId, userProperties, eventName, properties, triggerOnMount])

  const handleClick = () => {
    if (posthog && eventName && !triggerOnMount) {
      posthog.capture(eventName, properties)
    }
  }

  if (!children) return null

  return (
    <div className={className} onClick={handleClick}>
      {children}
    </div>
  )
}

export default PostHogTracker
