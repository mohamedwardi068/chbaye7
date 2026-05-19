import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "danger" | "outline";

interface GhostButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const GRADIENT_COLORS: Record<Variant, [string, string]> = {
  primary: ["#00D4FF", "#0050FF"],
  secondary: ["#1A1D21", "#111214"],
  danger: ["#FF3B30", "#FF6B35"],
  outline: ["transparent", "transparent"],
};

export function GhostButton({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: GhostButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 18 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18 });
        }}
        onPress={onPress}
        disabled={disabled || loading}
        style={{ opacity: disabled ? 0.45 : 1 }}
      >
        <LinearGradient
          colors={GRADIENT_COLORS[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            variant === "outline" && {
              borderWidth: 1.5,
              borderColor: colors.primary,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              color={variant === "primary" ? "#0A0A0A" : colors.primary}
              size="small"
            />
          ) : (
            <Text
              style={[
                styles.text,
                {
                  color:
                    variant === "primary"
                      ? "#0A0A0A"
                      : variant === "danger"
                        ? "#FFFFFF"
                        : colors.primary,
                },
              ]}
            >
              {title}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  gradient: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
