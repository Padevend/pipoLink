import { LoginForm } from '@/features/auth/components/login-form';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

export default function LoginScreen() {

  return (
      <View className="flex-1">
        <StatusBar style="light" />

        <View className="absolute w-full h-full">
          <ImageBackground
            source={require("@/assets/images/bg_002.jpg")}
            className="w-full h-full"
            resizeMode="cover"
          >
            <View className="flex-1" style={{ backgroundColor: 'rgba(10,10,10,0.80)' }} />
          </ImageBackground>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >

          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            className="flex-1"
          >
            <View className="flex-1 justify-end">
              <View className="items-start mb-10 px-8">
                <View className="w-16 h-16 bg-primary rounded-[20px] items-center justify-center shadow-2xl shadow-primary/50 mb-6">
                  <Text className="text-white text-3xl font-black italic">P</Text>
                </View>
                <Text className="text-4xl font-bold text-white tracking-tight">
                  Welcome back
                </Text>
                <Text className="text-slate-300 mt-2 text-lg font-medium">
                  Log in to your academic workspace.
                </Text>
              </View>


              <View className="bg-white dark:bg-background-dark p-1 rounded-t-[32px] pb-4">
                <LoginForm />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
  );
}