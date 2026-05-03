import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface CloudProps {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}

function Cloud({ x, y, scale = 1, opacity = 0.72 }: CloudProps) {
  const w = 90 * scale;
  const h = 38 * scale;
  const puff1 = 52 * scale;
  const puff2 = 42 * scale;
  const puff3 = 36 * scale;

  return (
    <View style={[styles.cloudGroup, { left: x, top: y, opacity }]}>
      <View style={[styles.cloudBase, { width: w, height: h, borderRadius: h / 2 }]} />
      <View
        style={[
          styles.cloudPuff,
          {
            width: puff1,
            height: puff1,
            borderRadius: puff1 / 2,
            top: -(puff1 * 0.4),
            left: w * 0.1,
          },
        ]}
      />
      <View
        style={[
          styles.cloudPuff,
          {
            width: puff2,
            height: puff2,
            borderRadius: puff2 / 2,
            top: -(puff2 * 0.35),
            left: w * 0.38,
          },
        ]}
      />
      <View
        style={[
          styles.cloudPuff,
          {
            width: puff3,
            height: puff3,
            borderRadius: puff3 / 2,
            top: -(puff3 * 0.3),
            left: w * 0.6,
          },
        ]}
      />
    </View>
  );
}

export default function ScreenBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Large background cross */}
      <View style={styles.crossContainer}>
        <View style={styles.crossVertical} />
        <View style={styles.crossHorizontal} />
      </View>

      {/* Clouds at various depths */}
      <Cloud x={-30} y={height * 0.04} scale={1.4} opacity={0.65} />
      <Cloud x={width * 0.42} y={height * 0.02} scale={0.9} opacity={0.55} />
      <Cloud x={width * 0.68} y={height * 0.07} scale={1.1} opacity={0.6} />
      <Cloud x={width * 0.05} y={height * 0.18} scale={0.75} opacity={0.45} />
      <Cloud x={width * 0.55} y={height * 0.14} scale={1.0} opacity={0.5} />
      <Cloud x={-10} y={height * 0.35} scale={0.85} opacity={0.4} />
      <Cloud x={width * 0.6} y={height * 0.42} scale={1.2} opacity={0.38} />
      <Cloud x={width * 0.2} y={height * 0.55} scale={0.7} opacity={0.32} />
      <Cloud x={width * 0.7} y={height * 0.65} scale={0.95} opacity={0.35} />
      <Cloud x={-20} y={height * 0.72} scale={1.1} opacity={0.3} />
      <Cloud x={width * 0.45} y={height * 0.8} scale={0.8} opacity={0.28} />
    </View>
  );
}

const styles = StyleSheet.create({
  crossContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  crossVertical: {
    position: "absolute",
    width: 80,
    height: height * 0.75,
    backgroundColor: "rgba(255,255,255,0.42)",
    borderRadius: 40,
  },
  crossHorizontal: {
    position: "absolute",
    width: width * 0.72,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.42)",
    borderRadius: 40,
    top: "30%",
  },

  cloudGroup: {
    position: "absolute",
  },
  cloudBase: {
    backgroundColor: "#FFFFFF",
    position: "absolute",
    top: 14,
  },
  cloudPuff: {
    backgroundColor: "#FFFFFF",
    position: "absolute",
  },
});
