import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { GhostButton } from "@/components/GhostButton";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const floatY = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-12, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    glowScale.value = withRepeat(
      withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.12 + (glowScale.value - 1) * 2,
  }));

  const login = useLogin({
    mutation: {
      onSuccess: async (data) => {
        await signIn(data.token, data.user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (data.user.role === "rider") {
          router.replace("/(rider)/home");
        } else {
          router.replace("/(driver)/home");
        }
      },
      onError: (err) => {
        const msg =
          err instanceof Error
            ? err.message
            : "Invalid credentials";
        setError(msg.replace("HTTP 401 Unauthorized: ", "").replace("HTTP 400 Bad Request: ", ""));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    login.mutate({ data: { email: email.trim().toLowerCase(), password } });
  };

  const topPad =
    insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={styles.glowWrapper}>
              <Animated.View
                style={[
                  styles.glow,
                  { backgroundColor: colors.primary },
                  glowStyle,
                ]}
              />
              <Animated.View style={floatStyle}>
                <MaterialCommunityIcons
                  name="ghost"
                  size={72}
                  color={colors.primary}
                />
              </Animated.View>
            </View>
            <Text style={[styles.brand, { color: colors.primary }]}>
              chbaye7
            </Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              phantom rides · ghost dispatch
            </Text>
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : null}

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Email"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <GhostButton
            title="Enter the void"
            onPress={handleLogin}
            loading={login.isPending}
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace("/(auth)/register")}
          >
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
              New phantom?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Register
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 52,
  },
  glowWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  glow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  brand: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
    marginTop: 8,
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
    marginTop: 6,
    textTransform: "uppercase",
  },
  error: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 18,
    marginBottom: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  link: {
    marginTop: 28,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
