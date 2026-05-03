import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import colors from "@/constants/colors";

interface Props {
  duration: number;
  onExpire: () => void;
  running: boolean;
}

export default function TimerBar({ duration, onExpire, running }: Props) {
  const c = colors.light;
  const anim = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    anim.setValue(1);
    if (running) {
      animRef.current = Animated.timing(anim, {
        toValue: 0,
        duration: duration * 1000,
        useNativeDriver: false,
      });
      animRef.current.start(({ finished }) => {
        if (finished) onExpire();
      });
    } else {
      animRef.current?.stop();
    }
    return () => {
      animRef.current?.stop();
    };
  }, [running, duration]);

  const barColor = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [c.wrong, c.primary, c.correct],
  });

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.bar, { width, backgroundColor: barColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: colors.light.muted,
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
});
