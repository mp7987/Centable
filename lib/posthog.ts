import PostHog from 'posthog-react-native'

function getPostHogConfig() {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST

  if (!apiKey || !host) {
    throw new Error('Missing PostHog configuration in .env')
  }

  return { apiKey, host }
}

const { apiKey, host } = getPostHogConfig()

export const posthog = new PostHog(apiKey, {
  host,
})
