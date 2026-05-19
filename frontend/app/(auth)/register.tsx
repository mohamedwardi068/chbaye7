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
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { GhostButton } from "@/components/GhostButton";
import { useColors } from "@/hooks/useColors";

type Role = "rider" | "driver";

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("rider");
  const [error, setError] = useState("");

  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-10, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const register = useRegister({
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
          err instanceof Error ? err.message : "Registration failed";
        setError(msg.replace("HTTP 400 Bad Request: ", ""));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    },
  });

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setError("All fields are required");
      return;
    }
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    register.mutate({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        role,
      }
    });
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

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
          <View style={styles.header}>
            <Animated.View style={floatStyle}>
              <MaterialCommunityIcons
                name="ghost"
                size={52}
                color={colors.primary}
              />
            </Animated.View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Join the fleet
            </Text>
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : null}

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            I am a
          </Text>
          <View style={styles.roleRow}>
            {(["rider", "driver"] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleBtn,
                  {
                    backgroundColor:
                      role === r ? `${colors.primary}22` : colors.card,
                    borderColor:
                      role === r ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setRole(r);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons
                  name={r === "rider" ? "person" : "car"}
                  size={20}
                  color={role === r ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    {
                      color:
                        role === r ? colors.primary : colors.mutedForeground,
                    },
                  ]}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {[
            { label: "Full name", value: name, setter: setName, key: "name" },
            {
              label: "Email",
              value: email,
              setter: setEmail,
              key: "email",
              keyboard: "email-address" as const,
            },
            {
              label: "Password",
              value: password,
              setter: setPassword,
              key: "pass",
              secure: true,
            },
            {
              label: "Phone",
              value: phone,
              setter: setPhone,
              key: "phone",
              keyboard: "phone-pad" as const,
            },
          ].map((field) => (
            <TextInput
              key={field.key}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder={field.label}
              placeholderTextColor={colors.mutedForeground}
              value={field.value}
              onChangeText={field.setter}
              keyboardType={field.keyboard ?? "default"}
              autoCapitalize={field.key === "name" ? "words" : "none"}
              autoCorrect={false}
              secureTextEntry={!!field.secure}
            />
          ))}

          <GhostButton
            title="Become a phantom"
            onPress={handleRegister}
            loading={register.isPending}
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity
            style={styles.link}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
              Already a phantom?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  roleBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
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
    height: 54,
    paddingHorizontal: 18,
    marginBottom: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  link: { marginTop: 28, alignItems: "center" },
  linkText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
