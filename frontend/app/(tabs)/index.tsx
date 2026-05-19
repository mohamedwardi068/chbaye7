import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AuthGate() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    } else if (user?.role === "rider") {
      router.replace("/(rider)/home");
    } else {
      router.replace("/(driver)/home");
    }
  }, [isAuthenticated, isLoading, user]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
