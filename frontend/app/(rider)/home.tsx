import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
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
import { useCreateRide, useGetActiveRide } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { GhostButton } from "@/components/GhostButton";
import { GlowCard } from "@/components/GlowCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";

export default function RiderHome() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { currentRideStatus, setCurrentRideStatus } = useSocket();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");

  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const { data: activeData, refetch } = useGetActiveRide({
    query: { refetchInterval: 8000 } as any,
  });

  const activeRide = activeData?.ride ?? null;

  const createRide = useCreateRide({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentRideStatus("searching");
        setPickup("");
        setDestination("");
        router.push("/(rider)/ride");
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Failed to create ride";
        setError(msg.replace("HTTP 400 Bad Request: ", ""));
      },
    },
  });

  const handleRequest = () => {
    if (!pickup.trim() || !destination.trim()) {
      setError("Please enter pickup and destination");
      return;
    }
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createRide.mutate({ data: { pickupLocation: pickup.trim(), destination: destination.trim() } });
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Welcome back
            </Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/login");
            }}
            style={[styles.logoutBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {activeRide ? (
          <GlowCard style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Ride
            </Text>
            <StatusBadge status={activeRide.status} size="sm" />
            <View style={styles.rideInfo}>
              <View style={styles.locationRow}>
                <Ionicons name="radio-button-on" size={14} color={colors.primary} />
                <Text style={[styles.locationText, { color: colors.foreground }]} numberOfLines={1}>
                  {activeRide.pickupLocation}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.destructive} />
                <Text style={[styles.locationText, { color: colors.foreground }]} numberOfLines={1}>
                  {activeRide.destination}
                </Text>
              </View>
            </View>
            <GhostButton
              title="View ride"
              onPress={() => router.push("/(rider)/ride")}
              variant="outline"
              style={{ marginTop: 16 }}
            />
          </GlowCard>
        ) : null}

        <View style={styles.heroSection}>
          <Animated.View style={floatStyle}>
            <MaterialCommunityIcons name="ghost" size={56} color={colors.primary} />
          </Animated.View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Request a ride
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            A ghost driver will find you
          </Text>
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <GlowCard style={{ gap: 12 }}>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="radio-button-on"
              size={16}
              color={colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Pickup location"
              placeholderTextColor={colors.mutedForeground}
              value={pickup}
              onChangeText={setPickup}
            />
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.inputWrapper}>
            <Ionicons
              name="location"
              size={16}
              color={colors.destructive}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Destination"
              placeholderTextColor={colors.mutedForeground}
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </GlowCard>

        <GhostButton
          title="Summon a driver"
          onPress={handleRequest}
          loading={createRide.isPending}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  scroll: { paddingHorizontal: 24 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingTop: 8,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: { alignItems: "center", marginVertical: 32, gap: 8 },
  heroTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  error: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
  inputWrapper: { flexDirection: "row", alignItems: "center", gap: 12 },
  inputIcon: { width: 20 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 4,
  },
  separator: { height: 1, marginHorizontal: -16 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  rideInfo: { gap: 8, marginTop: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  divider: { height: 1, marginLeft: 22 },
});
