import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, formatErr } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

const METHODS = [
  { key: "upi", label: "UPI", sub: "PhonePe, GPay, Paytm", icon: "phone-portrait-outline" },
  { key: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay", icon: "card-outline" },
  { key: "netbanking", label: "Net Banking", sub: "All Indian banks", icon: "business-outline" },
];

export default function Payment() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/bookings/${bookingId}`);
      setBooking(data);
    })();
  }, [bookingId]);

  const pay = async () => {
    setProcessing(true); setErr("");
    try {
      // Simulated processing delay
      await new Promise((r) => setTimeout(r, 1800));
      await api.post("/payments/process", { booking_id: bookingId, method });
      router.replace(`/confirmation/${bookingId}`);
    } catch (e: any) {
      setErr(formatErr(e));
      setProcessing(false);
    }
  };

  if (!booking) {
    return <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} disabled={processing}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
        <View style={styles.amtCard}>
          <Text style={styles.amtLabel}>Amount Payable</Text>
          <Text style={styles.amt}>₹{booking.amount.toLocaleString("en-IN")}</Text>
          <Text style={styles.amtSub}>{booking.service_name} · {booking.package_name}</Text>
        </View>

        <Text style={styles.section}>Choose Payment Method</Text>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m.key}
            testID={`method-${m.key}`}
            style={[styles.method, method === m.key && styles.methodActive]}
            onPress={() => setMethod(m.key)}
            disabled={processing}
          >
            <View style={styles.methodIcon}><Ionicons name={m.icon as any} size={20} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodLabel}>{m.label}</Text>
              <Text style={styles.methodSub}>{m.sub}</Text>
            </View>
            <View style={[styles.radio, method === m.key && styles.radioActive]}>
              {method === m.key && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.secureNote}>
          <Ionicons name="lock-closed" size={14} color={colors.success} />
          <Text style={styles.secureText}>Secured demo payment · No real charge applied</Text>
        </View>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <TouchableOpacity testID="pay-btn" style={styles.cta} onPress={pay} disabled={processing}>
          {processing ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.ctaText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.ctaText}>Pay ₹{booking.amount.toLocaleString("en-IN")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  amtCard: { padding: 22, borderRadius: 18, backgroundColor: colors.primary, marginBottom: 26, alignItems: "center" },
  amtLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  amt: { color: "#fff", fontSize: 38, fontWeight: "700", fontFamily: "serif", marginTop: 4 },
  amtSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 6 },
  section: { color: colors.text, fontWeight: "700", fontSize: 14, marginBottom: 12 },
  method: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10, backgroundColor: "#fff" },
  methodActive: { borderColor: colors.primary },
  methodIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  methodLabel: { color: colors.text, fontSize: 15, fontWeight: "600" },
  methodSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  secureNote: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 14, padding: 12, backgroundColor: "#E8F5E9", borderRadius: 10 },
  secureText: { color: colors.success, fontSize: 12, fontWeight: "500" },
  err: { color: colors.primary, marginTop: 14, fontSize: 13 },
  cta: { marginTop: 22, height: 58, backgroundColor: colors.primary, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
