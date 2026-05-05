import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

export default function Confirmation() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/bookings/${bookingId}`);
      setBooking(data);
    })();
  }, [bookingId]);

  if (!booking) {
    return <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={56} color="#fff" />
          </View>
        </View>
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your reservation has been successfully placed. Have a wonderful celebration!</Text>

        <View style={styles.card}>
          <Row k="Booking ID" v={booking.id.slice(0, 8).toUpperCase()} />
          <Row k="Service" v={booking.service_name} />
          <Row k="Package" v={booking.package_name} />
          <Row k="Date" v={booking.booking_date} />
          {booking.transaction_id && <Row k="Transaction" v={booking.transaction_id} />}
          <View style={styles.divider} />
          <Row k="Amount Paid" v={`₹${booking.amount.toLocaleString("en-IN")}`} bold />
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.statusText}>Payment Successful</Text>
          </View>
        </View>

        <Text style={styles.note}>
          A confirmation has been sent. Our team will be in touch shortly with next steps.
        </Text>

        <TouchableOpacity testID="view-bookings-btn" style={styles.cta} onPress={() => router.replace("/(tabs)/bookings")}>
          <Text style={styles.ctaText}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="back-home-btn" style={styles.ctaSec} onPress={() => router.replace("/(tabs)/home")}>
          <Text style={styles.ctaSecText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowK}>{k}</Text>
      <Text style={[styles.rowV, bold && { fontSize: 18, color: colors.primary, fontWeight: "700" }]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 28, alignItems: "center" },
  iconWrap: { marginTop: 20, marginBottom: 14 },
  iconCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 30, color: colors.text, fontWeight: "500", fontFamily: "serif", marginTop: 14 },
  subtitle: { color: colors.textMuted, textAlign: "center", marginTop: 8, fontSize: 14, lineHeight: 20, paddingHorizontal: 14 },
  card: { width: "100%", padding: 20, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, marginTop: 28 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
  rowK: { color: colors.textMuted, fontSize: 13 },
  rowV: { color: colors.text, fontSize: 13, fontWeight: "500", maxWidth: "60%", textAlign: "right" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 32, borderRadius: 16, backgroundColor: "#E8F5E9", marginTop: 14, alignSelf: "flex-start" },
  statusText: { color: colors.success, fontSize: 12, fontWeight: "700" },
  note: { color: colors.textMuted, textAlign: "center", marginTop: 20, fontSize: 13, paddingHorizontal: 14 },
  cta: { marginTop: 28, width: "100%", height: 56, backgroundColor: colors.primary, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  ctaSec: { marginTop: 12, width: "100%", height: 50, alignItems: "center", justifyContent: "center" },
  ctaSecText: { color: colors.primary, fontWeight: "600", fontSize: 14 },
});
