import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetActiveRide } from "@workspace/api-client-react";
import { useSocket } from "@/context/SocketContext";
import { GlowCard } from "@/components/GlowCard";
import { StatusBadge } from "@/components/StatusBadge";
import { GhostButton } from "@/components/GhostButton";
import { useColors } from "@/hooks/useColors";

const STEPS = ["searching", "accepted", "arrived", "started", "completed"];

export default function RiderRide() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentRideStatus, setCurrentRideStatus } = useSocket();

  const { data: activeData, refetch } = useGetActiveRide({
    query: { refetchInterval: currentRideStatus === "searching" ? 4000 : 10000 } as any,
  });

  const ride = activeData?.ride ?? null;
  const displayStatus = currentRideStatus ?? ride?.status ?? "searching";
  const driver = (ride as { driver?: { name: string; phone: string } } | null)?.driver;

  useEffect(() => {
    if (currentRideStatus) refetch();
  }, [currentRideStatus]);

  const stepIndex = STEPS.indexOf(displayStatus);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.ghostHeader}>
          <MaterialCommunityIcons name="ghost" size={44} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            Your ride
          </Text>
        </View>

        <StatusBadge status={displayStatus} size="lg" />

        {ride ? (
          <GlowCard style={{ marginTop: 24 }}>
            <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
              Trip details
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="radio-button-on" size={14} color={colors.primary} />
              <View style={styles.locText}>
                <Text style={[styles.locLabel, { color: colors.mutedForeground }]}>
                  From
                </Text>
                <Text style={[styles.locValue, { color: colors.foreground }]}>
                  {ride.pickupLocation}
                </Text>
              </View>
            </View>
            <View style={[styles.connector, { backgroundColor: colors.border }]} />
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.destructive} />
              <View style={styles.locText}>
                <Text style={[styles.locLabel, { color: colors.mutedForeground }]}>
                  To
                </Text>
                <Text style={[styles.locValue, { color: colors.foreground }]}>
                  {ride.destination}
                </Text>
              </View>
            </View>
          </GlowCard>
        ) : null}

        {driver && displayStatus !== "searching" ? (
          <GlowCard style={{ marginTop: 16 }} glowColor={colors.accent}>
            <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
              Your driver
            </Text>
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, { backgroundColor: colors.secondary }]}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.driverName, { color: colors.foreground }]}>
                  {driver.name}
                </Text>
                <Text style={[styles.driverPhone, { color: colors.mutedForeground }]}>
                  {driver.phone}
                </Text>
              </View>
            </View>
          </GlowCard>
        ) : null}

        <View style={styles.timeline}>
          {STEPS.map((step, i) => {
            const done = i <= stepIndex;
            const active = i === stepIndex;
            return (
              <View key={step} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: done ? colors.primary : colors.muted,
                        borderColor: active ? colors.primary : "transparent",
                        borderWidth: active ? 2 : 0,
                        transform: [{ scale: active ? 1.3 : 1 }],
                      },
                    ]}
                  />
                  {i < STEPS.length - 1 ? (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: i < stepIndex ? colors.primary : colors.muted },
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    {
                      color: done ? colors.foreground : colors.mutedForeground,
                      fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </Text>
              </View>
            );
          })}
        </View>

        {displayStatus === "completed" ? (
          <GhostButton
            title="Back to home"
            onPress={() => {
              setCurrentRideStatus(null);
              router.replace("/(rider)/home");
            }}
            variant="secondary"
            style={{ marginTop: 24 }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  scroll: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 20 },
  ghostHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  cardTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  locText: { flex: 1, gap: 2 },
  locLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  locValue: { fontSize: 15, fontFamily: "Inter_500Medium" },
  connector: { height: 20, width: 1, marginLeft: 7, marginVertical: 4 },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  driverPhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  timeline: { marginTop: 32, gap: 0 },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  timelineLeft: { alignItems: "center", width: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, height: 32, marginTop: 4 },
  timelineLabel: { fontSize: 14, paddingTop: 0, paddingBottom: 32 },
});
