import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";

interface Props {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  small?: boolean;
}

export default function StatCard({ label, value, icon, color, small }: Props) {
  const c = colors.light;
  const accentColor = color ?? c.primary;

  return (
    <View style={[styles.card, small && styles.cardSmall]}>
      <View style={[styles.iconBox, { backgroundColor: accentColor + "22" }]}>
        <Feather name={icon as any} size={small ? 16 : 20} color={accentColor} />
      </View>
      <Text style={[styles.value, small && styles.valueSmall]}>{value}</Text>
      <Text style={[styles.label, small && styles.labelSmall]}>{label}</Text>
    </View>
  );
}

const c = colors.light;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardSmall: {
    padding: 12,
    gap: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    color: c.foreground,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  valueSmall: {
    fontSize: 18,
  },
  label: {
    color: c.mutedForeground,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  labelSmall: {
    fontSize: 11,
  },
});
