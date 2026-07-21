import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { styled } from 'nativewind'
import { type Href, Link, useRouter } from 'expo-router'
import { useAuth, useSignUp } from '@clerk/expo'
import clsx from 'clsx'
import AuthBrand from '@/components/AuthBrand'
import { getClerkErrorMessage, isValidEmail } from '@/lib/utils'
import { posthog } from '@/lib/posthog'

const SafeAreaView = styled(RNSafeAreaView)

type FieldErrors = {
  email?: string
  password?: string
  confirmPassword?: string
  code?: string
}

type NavigateParams = {
  session?: { currentTask?: unknown } | null
  decorateUrl: (url: string) => string
}

const SignUp = () => {
  const { signUp, errors, fetchStatus } = useSignUp()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isSubmitting = fetchStatus === 'fetching'
  const isVerifyingEmail =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields?.includes('email_address') &&
    signUp.missingFields?.length === 0

  const emailError = fieldErrors.email ?? errors.fields.emailAddress?.message
  const passwordError = fieldErrors.password ?? errors.fields.password?.message
  const codeError = fieldErrors.code ?? errors.fields.code?.message

  if (signUp.status === 'complete' || isSignedIn) return null

  const goHome = async ({ session, decorateUrl }: NavigateParams) => {
    if (session?.currentTask) return
    router.replace(decorateUrl('/') as Href)
  }

  const validateDetails = () => {
    const nextErrors: FieldErrors = {}
    if (!emailAddress.trim()) nextErrors.email = 'Enter your email address.'
    else if (!isValidEmail(emailAddress)) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Create a password.'
    else if (password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.'
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleCreateAccount = async () => {
    setFormError(null)
    if (!validateDetails()) return

    const { error } = await signUp.password({ emailAddress: emailAddress.trim(), password })
    if (error) {
      setFormError(getClerkErrorMessage(error, "We couldn't create your account. Please try again."))
      return
    }

    await signUp.verifications.sendEmailCode()
  }

  const handleVerifyEmail = async () => {
    setFormError(null)
    if (!code.trim()) {
      setFieldErrors((prev) => ({ ...prev, code: 'Enter the verification code.' }))
      return
    }

    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() })
    if (error) {
      setFormError(getClerkErrorMessage(error, "That code didn't work. Please try again."))
      return
    }

    if (signUp.status === 'complete') {
      posthog.capture('account_created', { authentication_method: 'email_code' })
      await signUp.finalize({ navigate: goHome })
    } else {
      setFormError("We couldn't verify your email. Please try again.")
    }
  }

  const handleResendCode = () => {
    setFormError(null)
    signUp.verifications.sendEmailCode()
  }

  return (
    <SafeAreaView className="auth-safe-area" edges={['top', 'bottom']}>
      <KeyboardAvoidingView className="auth-screen" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthBrand />

          {isVerifyingEmail ? (
            <>
              <View className="auth-header-block">
                <Text className="auth-title">Check your email</Text>
                <Text className="auth-subtitle">
                  We sent a verification code to {signUp.emailAddress ?? emailAddress}. Enter it below to activate
                  your account.
                </Text>
              </View>

              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">Verification code</Text>
                    <TextInput
                      className={clsx('auth-input', codeError && 'auth-input-error')}
                      value={code}
                      onChangeText={(value) => {
                        setCode(value)
                        setFieldErrors((prev) => ({ ...prev, code: undefined }))
                      }}
                      placeholder="Enter your 6-digit code"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                    />
                    {codeError && <Text className="auth-error">{codeError}</Text>}
                  </View>

                  {formError && <Text className="auth-error">{formError}</Text>}

                  <Pressable
                    className={clsx('auth-button', isSubmitting && 'auth-button-disabled')}
                    onPress={handleVerifyEmail}
                    disabled={isSubmitting}
                  >
                    <Text className="auth-button-text">{isSubmitting ? 'Verifying...' : 'Verify & continue'}</Text>
                  </Pressable>

                  <Pressable className="auth-secondary-button" onPress={handleResendCode} disabled={isSubmitting}>
                    <Text className="auth-secondary-button-text">Resend code</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <>
              <View className="auth-header-block">
                <Text className="auth-title">Create your account</Text>
                <Text className="auth-subtitle">Track every subscription and never miss a renewal again.</Text>
              </View>

              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">Email address</Text>
                    <TextInput
                      className={clsx('auth-input', emailError && 'auth-input-error')}
                      value={emailAddress}
                      onChangeText={(value) => {
                        setEmailAddress(value)
                        setFieldErrors((prev) => ({ ...prev, email: undefined }))
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(0,0,0,0.)"
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                    />
                    {emailError && <Text className="auth-error">{emailError}</Text>}
                  </View>

                  <View className="auth-field">
                    <Text className="auth-label">Password</Text>
                    <TextInput
                      className={clsx('auth-input', passwordError && 'auth-input-error')}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value)
                        setFieldErrors((prev) => ({ ...prev, password: undefined }))
                      }}
                      placeholder="Create a password"
                      placeholderTextColor="rgba(0,0,0,0.)"
                      secureTextEntry
                      autoComplete="new-password"
                    />
                    {passwordError && <Text className="auth-error">{passwordError}</Text>}
                  </View>

                  <View className="auth-field">
                    <Text className="auth-label">Confirm password</Text>
                    <TextInput
                      className={clsx('auth-input', fieldErrors.confirmPassword && 'auth-input-error')}
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value)
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                      }}
                      placeholder="Re-enter your password"
                      placeholderTextColor="rgba(0,0,0,0.)"
                      secureTextEntry
                      autoComplete="new-password"
                    />
                    {fieldErrors.confirmPassword && <Text className="auth-error">{fieldErrors.confirmPassword}</Text>}
                  </View>

                  {formError && <Text className="auth-error">{formError}</Text>}

                  <Pressable
                    className={clsx(
                      'auth-button',
                      (isSubmitting || !emailAddress || !password || !confirmPassword) && 'auth-button-disabled'
                    )}
                    onPress={handleCreateAccount}
                    disabled={isSubmitting || !emailAddress || !password || !confirmPassword}
                  >
                    <Text className="auth-button-text">{isSubmitting ? 'Creating account...' : 'Create account'}</Text>
                  </Pressable>

                  <View nativeID="clerk-captcha" />
                </View>
              </View>

              <View className="auth-link-row">
                <Text className="auth-link-copy">Already have an account?</Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Text className="auth-link">Sign in</Text>
                </Link>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default SignUp
