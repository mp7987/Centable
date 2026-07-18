# PostHog post-wizard report

The wizard integrated PostHog product analytics into the Expo application. It installed `posthog-react-native` with its Expo-compatible dependencies, configured the public PostHog token and host through `EXPO_PUBLIC_` environment variables, and created a shared client initialized at the application root.

The root layout now manually tracks Expo Router screens, enables touch autocapture, and identifies authenticated Clerk users using their stable Clerk user ID. Custom events cover completed account creation, successful authentication, subscription-detail engagement, and sign-out. Event payloads avoid email addresses, names, payment information, and other user-entered PII.

| Event name | Description | File |
| --- | --- | --- |
| `account_created` | Captures completion of a new account registration. | `app/(auth)/sign-up.tsx` |
| `signed_in` | Captures completion of an authenticated sign-in. | `app/(auth)/sign-in.tsx` |
| `subscription_details_expanded` | Captures when a subscription's details are expanded from the home list. | `app/(tabs)/index.tsx` |
| `signed_out` | Captures a completed account sign-out. | `app/(tabs)/settings.tsx` |

## Next steps

The following dashboard and insights were created for the instrumented events:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/515953/dashboard/1861498)
- [Account creation trend (wizard)](https://us.posthog.com/project/515953/insights/3YMwGa08)
- [Authentication conversion funnel (wizard)](https://us.posthog.com/project/515953/insights/vheYgTfp)
- [Subscription details engagement (wizard)](https://us.posthog.com/project/515953/insights/pm1fYoIc)
- [Sign-outs trend (wizard)](https://us.posthog.com/project/515953/insights/cj1y8un0)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names added to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs.

### Agent skill

The Expo integration skill remains in `.claude/skills/integration-expo` for future agent-assisted PostHog work.
