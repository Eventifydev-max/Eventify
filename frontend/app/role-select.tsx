import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../src/lib/theme";

export default function RoleSelect() {
  const router = useRouter();

  const go = (role: "customer" | "vendor") =>
    router.push({ pathname: "/phone", params: { role } });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <Image source={require("../assets/images/eventify-logo.png")} style={styles.logo} />
          <Text style={styles.brand}>EVENTIFY</Text>
        </View>
        <Text style={styles.title}>How will you{"\n"}use Eventify?</Text>
        <Text style={styles.sub}>Choose your role to continue</Text>

        <TouchableOpacity testID="role-customer" style={styles.cardWrap} activeOpacity={0.85} onPress={() => go("customer")}>
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=85" }}
            style={styles.card}
            imageStyle={{ borderRadius: 22 }}
          >
            <LinearGradient colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.85)"]} style={styles.grad}>
              <View style={styles.iconBadge}>
                <Ionicons name="heart" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }} />
              <Text style={styles.cardLabel}>Plan My Event</Text>
              <Text style={styles.cardDesc}>Browse venues, pandits & videographers. Book in minutes.</Text>
              <View style={styles.cardCta}>
                <Text style={styles.cardCtaText}>Continue as Customer</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity testID="role-vendor" style={styles.cardWrap} activeOpacity={0.85} onPress={() => go("vendor")}>
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?w=900&q=85" }}
            style={styles.card}
            imageStyle={{ borderRadius: 22 }}
          >
            <LinearGradient colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.85)"]} style={styles.grad}>
              <View style={styles.iconBadge}>
                <Ionicons name="briefcase" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }} />
              <Text style={styles.cardLabel}>List My Business</Text>
              <Text style={styles.cardDesc}>Showcase your venue, services or studio. Get bookings.</Text>
              <View style={styles.cardCta}>
                <Text style={styles.cardCtaText}>Continue as Vendor</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
          <Text style={styles.footerText}>Secure SMS-based login · No password needed</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", marginBottom: 12 },
  brand: { color: colors.primary, letterSpacing: 4, fontSize: 11, fontWeight: "700", marginBottom: 14 },
  title: { fontSize: 30, fontWeight: "500", color: colors.text, fontFamily: "serif", marginBottom: 6, lineHeight: 36 },
  sub: { color: colors.textMuted, fontSize: 14, marginBottom: 24 },
  cardWrap: { marginBottom: 16 },
  card: { height: 220 },
  grad: { flex: 1, borderRadius: 22, padding: 20 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  cardLabel: { color: "#fff", fontSize: 22, fontWeight: "600", fontFamily: "serif", marginBottom: 4 },
  cardDesc: { color: "rgba(255,255,255,0.88)", fontSize: 13, lineHeight: 18, marginBottom: 12 },
  cardCta: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardCtaText: { color: colors.accent, fontWeight: "700", fontSize: 13, letterSpacing: 0.4 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
  footerText: { color: colors.textMuted, fontSize: 12 },
});
