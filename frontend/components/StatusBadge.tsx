import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  searching: {
    label: "Searching for a driver...",
    color: "#F59E0B",
    bg: "#F59E0B1A",
  },
  accepted: { label: "Driver assigned", color: "#00D4FF", bg: "#00D4FF1A" },
  arrived: {
    label: "Driver has arrived",
    color: "#10B981",
    bg: "#10B9811A",
  },
  started: { label: "Ride in progress", color: "#0050FF", bg: "#0050FF1A" },
  completed: { label: "Ride completed", color: "#6B7280", bg: "#6B72801A" },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "lg";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config: StatusConfig = STATUS_CONFIG[status] ?? {
    label: status,
    color: "#6B7280",
    bg: "#6B72801A",
  };
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (status === "searching" || status === "accepted") {
      opacity.value = withRepeat(
        withTiming(0.35, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    } else {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [status]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg },
        size === "lg" && styles.large,
      ]}
    >
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: config.color },
          size === "lg" && styles.largeDot,
          animStyle,
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: config.color },
          size === "lg" && styles.largeLabel,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    alignSelf: "flex-start",
  },
  large: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  largeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  largeLabel: {
    fontSize: 15,
  },
});
