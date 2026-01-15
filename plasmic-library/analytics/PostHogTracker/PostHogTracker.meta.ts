const PostHogTrackerMeta = {
  name: "PostHogTracker",
  section: "7.📊 Analytics", 
  displayName: "PostHog Tracker",
  description: "Track events and user properties with PostHog analytics",
  importPath: "./plasmic-library/analytics/PostHogTracker",
  thumbnailUrl: "https://posthog.com/brand/posthog-logo.svg",

  props: {
    eventName: {
      type: "string",
      defaultValue: "",
      description: "Name of the event to track",
    },
    properties: {
      type: "object",
      defaultValue: {},
      description: "Additional properties to send with the event",
    },
    userId: {
      type: "string", 
      defaultValue: "",
      description: "Unique identifier for the user",
    },
    userProperties: {
      type: "object",
      defaultValue: {},
      description: "Properties to associate with the user",
    },
    triggerOnMount: {
      type: "boolean",
      defaultValue: false,
      description: "Whether to trigger the event when component mounts",
    },
    children: {
      type: "slot",
      description: "Content to wrap with tracking functionality",
    },
  },
};

export default PostHogTrackerMeta;
