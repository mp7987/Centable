import { View, Text } from 'react-native'

const AuthBrand = () => {
  return (
    <View className="auth-brand-block">
      <View className="auth-logo-wrap">
        <View className="auth-logo-mark">
          <Text className="auth-logo-mark-text">C</Text>
        </View>
        <View>
          <Text className="auth-wordmark">Centable</Text>
          <Text className="auth-wordmark-sub">Subscription Tracker</Text>
        </View>
      </View>
    </View>
  )
}

export default AuthBrand
