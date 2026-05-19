import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useGetActiveRide } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket, RideRequest } from "@/context/SocketContext";
import { GhostButton } from "@/components/GhostButton";
import { GlowCard } from "@/components/GlowCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";

function RideRequestCard({
  request,
  onAccept,
  onReject,
}: {
  request: RideRequest;
  onAccept: () => void;
  onReject: () => void;
}) {
  const colors = useColors();
  return (
    <GlowCard style={{ marginBottom: 14 }}>
      <View style={styles.reqHeader}>
        <MaterialCommunityIcons name="ghost" size={20} color={colors.primary} />
        <Text style={[styles.reqTime, { color: colors.mutedForeground }]}>
          New request
        </Text>
      </View>
      <View style={styles.reqLocations}>
        <View style={styles.reqRow}>
          <Ionicons name="radio-button-on" size={13} color={colors.primary} />
          <Text style={[styles.reqText, { color: colors.foreground }]} numberOfLines={1}>
            {request.pickupLocation}
          </Text>
        </View>
        <View style={[styles.reqLine, { backgroundColor: colors.border }]} />
        <View style={styles.reqRow}>
          <Ionicons name="location" size={13} color={colors.destructive} />
          <Text style={[styles.reqText, { color: colors.foreground }]} numberOfLines={1}>
            {request.destination}
          </Text>
        </View>
      </View>
      <View style={styles.reqActions}>
        <TouchableOpacity
          style={[styles.rejectBtn, { borderColor: colors.border }]}
          onPress={onReject}
        >
          <Ionicons name="close" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <GhostButton title="Accept" onPress={onAccept} />
        </View>
      </View>
    </GlowCard>
  );
}

export default function DriverHome() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const {
    isConnected,
    isOnline,
    goOnline,
    goOffline,
    pendingRequests,
    acceptedRideId,
    acceptRide,
    rejectRide,
    updateRideStatus,
    clearAcceptedRide,
  } = useSocket();

  const floatY = useSharedValue(0);
  const onlinePulse = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-8, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    if (isOnline) {
      onlinePulse.value = withRepeat(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      onlinePulse.value = withTiming(1);
    }
  }, [isOnline]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: onlinePulse.value }],
    opacity: 0.15,
  }));

  const { data: activeData } = useGetActiveRide({
    query: { enabled: !!acceptedRideId, refetchInterval: 15000 } as any,
  });

  const handleToggleOnline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isOnline) {
      goOffline();
    } else {
      goOnline();
    }
  };

  const handleAccept = (rideId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    acceptRide(rideId);
  };

  const handleStatusUpdate = (status: "arrived" | "started" | "completed") => {
    if (!acceptedRideId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateRideStatus(acceptedRideId, status);
    if (status === "completed") {
      clearAcceptedRide();
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={[styles.inner, { paddingBottom: bottomPad + 20 }]}>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Driver
            </Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name}
            </Text>
          </View>
          <View style={styles.topRight}>
            <View
              style={[
                styles.connDot,
                {
                  backgroundColor: isConnected
                    ? colors.primary
                    : colors.mutedForeground,
                },
              ]}
            />
            <TouchableOpacity
              onPress={async () => {
                await signOut();
                router.replace("/(auth)/login");
              }}
              style={[styles.logoutBtn, { borderColor: colors.border }]}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.onlineSection}
          onPress={handleToggleOnline}
          activeOpacity={0.85}
        >
          <View style={styles.onlineCenter}>
            <Animated.View
              style={[
                styles.onlineGlow,
                {
                  backgroundColor: isOnline ? colors.primary : colors.muted,
                },
                pulseStyle,
              ]}
            />
            <Animated.View style={floatStyle}>
              <MaterialCommunityIcons
                name="ghost"
                size={64}
                color={isOnline ? colors.primary : colors.mutedForeground}
              />
            </Animated.View>
          </View>
          <Text
            style={[
              styles.onlineStatus,
              { color: isOnline ? colors.primary : colors.mutedForeground },
            ]}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Text>
          <Text style={[styles.onlineHint, { color: colors.mutedForeground }]}>
            {isOnline ? "Tap to go offline" : "Tap to start receiving rides"}
          </Text>
        </TouchableOpacity>

        {acceptedRideId ? (
          <GlowCard glowColor={colors.accent} style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Ride
            </Text>
            <StatusBadge status="accepted" />
            <View style={{ gap: 10, marginTop: 16 }}>
              <GhostButton
                title="I have arrived"
                onPress={() => handleStatusUpdate("arrived")}
                variant="outline"
              />
              <GhostButton
                title="Start ride"
                onPress={() => handleStatusUpdate("started")}
                variant="secondary"
              />
              <GhostButton
                title="Complete ride"
                onPress={() => handleStatusUpdate("completed")}
                variant="primary"
              />
            </View>
          </GlowCard>
        ) : isOnline && pendingRequests.length > 0 ? (
          <View style={styles.requestsSection}>
            <Text
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              Incoming requests ({pendingRequests.length})
            </Text>
            <FlatList
              data={pendingRequests}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <RideRequestCard
                  request={item}
                  onAccept={() => handleAccept(item._id)}
                  onReject={() => {
                    rejectRide(item._id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : isOnline ? (
          <GlowCard style={{ marginTop: 16, alignItems: "center", padding: 28 }}>
            <Ionicons
              name="radio-outline"
              size={32}
              color={colors.mutedForeground}
            />
            <Text
              style={[
                styles.emptyText,
                { color: colors.mutedForeground, marginTop: 12 },
              ]}
            >
              Waiting for ride requests...
            </Text>
          </GlowCard>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  inner: { flex: 1, paddingHorizontal: 24 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineSection: { alignItems: "center", paddingVertical: 8 },
  onlineCenter: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  onlineStatus: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
    marginTop: 8,
  },
  onlineHint: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 6 },
  requestsSection: { marginTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 14,
  },
  reqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  reqTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  reqLocations: { gap: 6 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  reqLine: { height: 1, marginLeft: 21 },
  reqActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    alignItems: "center",
  },
  rejectBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
