import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { styled } from 'nativewind'
import { type Href, Link, useRouter } from 'expo-router'
import { useSignIn } from '@clerk/expo'
import clsx from 'clsx'
import AuthBrand from '@/components/AuthBrand'
import { getClerkErrorMessage, isValidEmail } from '@/lib/utils'
import "@/global.css"

const SafeAreaView = styled(RNSafeAreaView)

type FieldErrors = {
  email?: string
  password?: string
  code?: string
}

type NavigateParams = {
  session?: { currentTask?: unknown } | null
  decorateUrl: (url: string) => string
}

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [deviceTrustUnavailable, setDeviceTrustUnavailable] = useState(false)

  const isSubmitting = fetchStatus === 'fetching'
  const isVerifyingDevice = signIn.status === 'needs_client_trust' && !deviceTrustUnavailable

  const emailError = fieldErrors.email ?? errors.fields.identifier?.message
  const passwordError = fieldErrors.password ?? errors.fields.password?.message
  const codeError = fieldErrors.code ?? errors.fields.code?.message

  const goHome = async ({ session, decorateUrl }: NavigateParams) => {
    if (session?.currentTask) return
    router.replace(decorateUrl('/') as Href)
  }

  const validateCredentials = () => {
    const nextErrors: FieldErrors = {}
    if (!emailAddress.trim()) nextErrors.email = 'Enter your email address.'
    else if (!isValidEmail(emailAddress)) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter your password.'
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSignIn = async () => {
    setFormError(null)
    setDeviceTrustUnavailable(false)
    if (!validateCredentials()) return

    const { error } = await signIn.password({ emailAddress: emailAddress.trim(), password })
    if (error) {
      setFormError(getClerkErrorMessage(error, "We couldn't sign you in. Check your details and try again."))
      return
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: goHome })
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors?.find((factor) => factor.strategy === 'email_code')
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      } else {
        setDeviceTrustUnavailable(true)
        setFormError("We couldn't verify this device. Please try again or contact support.")
      }
    } else {
      setFormError("We couldn't sign you in. Check your details and try again.")
    }
  }

  const handleVerifyDevice = async () => {
    setFormError(null)
    if (!code.trim()) {
      setFieldErrors((prev) => ({ ...prev, code: 'Enter the code we emailed you.' }))
      return
    }

    const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() })
    if (error) {
      setFormError(getClerkErrorMessage(error, "That code didn't work. Please try again."))
      return
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: goHome })
    } else {
      setFormError("That code didn't work. Please try again.")
    }
  }

  const handleResendCode = () => {
    setFormError(null)
    signIn.mfa.sendEmailCode()
  }

  const handleStartOver = () => {
    setFormError(null)
    setCode('')
    signIn.reset()
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

          {isVerifyingDevice ? (
            <>
              <View className="auth-header-block">
                <Text className="auth-title">Verify it&apos;s you</Text>
                <Text className="auth-subtitle">Enter the code we emailed you to confirm this device.</Text>
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
                    onPress={handleVerifyDevice}
                    disabled={isSubmitting}
                  >
                    <Text className="auth-button-text">{isSubmitting ? 'Verifying...' : 'Verify'}</Text>
                  </Pressable>

                  <Pressable className="auth-secondary-button" onPress={handleResendCode} disabled={isSubmitting}>
                    <Text className="auth-secondary-button-text">Resend code</Text>
                  </Pressable>

                  <Pressable onPress={handleStartOver} disabled={isSubmitting}>
                    <Text className="auth-helper text-center">Start over</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <>
              <View className="auth-header-block">
                <Text className="auth-title">Welcome back</Text>
                <Text className="auth-subtitle">Sign in for sensible subscription management.</Text>
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
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(0,0,0,0.)"
                      secureTextEntry
                      autoComplete="password"
                    />
                    {passwordError && <Text className="auth-error">{passwordError}</Text>}
                  </View>

                  {formError && <Text className="auth-error">{formError}</Text>}

                  <Pressable
                    className={clsx('auth-button', (isSubmitting || !emailAddress || !password) && 'auth-button-disabled')}
                    onPress={handleSignIn}
                    disabled={isSubmitting || !emailAddress || !password}
                  >
                    <Text className="auth-button-text">{isSubmitting ? 'Signing in...' : 'Sign in'}</Text>
                  </Pressable>
                </View>
              </View>

              <View className="auth-link-row">
                <Text className="auth-link-copy">New to Centable?</Text>
                <Link href="/(auth)/sign-up" asChild>
                  <Text className="auth-link">Create an account</Text>
                </Link>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default SignIn
