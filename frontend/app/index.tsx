import React, { useEffect } from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../src/lib/auth";
import { colors } from "../src/lib/theme";

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "vendor") router.replace("/(vendor)/dashboard");
      else router.replace("/(tabs)/home");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1722952934661-dde241aeb591?crop=entropy&cs=srgb&fm=jpg&q=85" }}
      style={styles.bg}
      testID="splash-bg"
    >
      <LinearGradient colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.92)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.dot} />
          <Text style={styles.brand}>SHAADI SEWA</Text>
          <View style={styles.dot} />
        </View>
        <Text style={styles.title}>Your Perfect{"\n"}Wedding Awaits</Text>
        <Text style={styles.subtitle}>
          Discover venues, pandits & cinematographers — or list your business and earn.
        </Text>
        <TouchableOpacity
          testID="get-started-btn"
          style={styles.cta}
          onPress={() => router.push("/role-select")}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  bg: { flex: 1, justifyContent: "flex-end" },
  content: { padding: 28, paddingBottom: 56 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  brand: { color: colors.accent, letterSpacing: 4, fontSize: 12, fontWeight: "600" },
  title: { color: "#fff", fontSize: 44, lineHeight: 50, fontWeight: "400", fontFamily: "serif", marginBottom: 14 },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 22, marginBottom: 32 },
  cta: { backgroundColor: colors.primary, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "600", letterSpacing: 0.5 },
});
