import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api, formatErr } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

export default function BookingFlow() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [pkgIdx, setPkgIdx] = useState(0);
  const [date, setDate] = useState(new Date(Date.now() + 7 * 24 * 3600 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/services/${serviceId}`);
      setService(data);
    })();
  }, [serviceId]);

  const onConfirm = async () => {
    setSubmitting(true); setErr("");
    try {
      const pkg = service.packages[pkgIdx];
      const { data } = await api.post("/bookings", {
        service_id: serviceId,
        package_name: pkg.name,
        booking_date: date.toISOString().split("T")[0],
        guests: guests ? parseInt(guests) : undefined,
        notes,
      });
      router.replace(`/payment/${data.id}`);
    } catch (e: any) {
      setErr(formatErr(e));
    } finally { setSubmitting(false); }
  };

  if (!service) {
    return <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  const pkg = service.packages[pkgIdx];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
        <View style={styles.svcCard}>
          <Text style={styles.svcCat}>{service.category.toUpperCase()}</Text>
          <Text style={styles.svcName}>{service.name}</Text>
          <Text style={styles.svcLoc}>{service.location}</Text>
        </View>

        <Text style={styles.label}>Choose Package</Text>
        {service.packages.map((p: any, i: number) => (
          <TouchableOpacity
            key={i}
            testID={`pkg-${i}`}
            style={[styles.pkgCard, pkgIdx === i && styles.pkgActive]}
            onPress={() => setPkgIdx(i)}
          >
            <View style={[styles.radio, pkgIdx === i && styles.radioActive]}>
              {pkgIdx === i && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.pkgName}>{p.name}</Text>
              <Text style={styles.pkgDesc}>{p.description}</Text>
            </View>
            <Text style={styles.pkgPrice}>₹{p.price.toLocaleString("en-IN")}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Select Date</Text>
        <TouchableOpacity testID="date-btn" style={styles.dateBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.dateText}>{date.toDateString()}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            minimumDate={new Date()}
            onChange={(_, d) => { setShowPicker(Platform.OS === "ios"); if (d) setDate(d); }}
          />
        )}

        {service.category === "garden" && (
          <>
            <Text style={styles.label}>Number of Guests</Text>
            <TextInput
              testID="guests-input"
              style={styles.input}
              keyboardType="number-pad"
              placeholder="e.g., 250"
              placeholderTextColor="#9b958d"
              value={guests}
              onChangeText={setGuests}
            />
          </>
        )}

        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          testID="notes-input"
          style={[styles.input, { height: 90, textAlignVertical: "top", paddingTop: 12 }]}
          multiline
          placeholder="Any special requirements?"
          placeholderTextColor="#9b958d"
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.summary}>
          <Text style={styles.sumTitle}>Booking Summary</Text>
          <Row k="Service" v={service.name} />
          <Row k="Package" v={pkg.name} />
          <Row k="Date" v={date.toDateString()} />
          <View style={styles.divider} />
          <Row k="Total" v={`₹${pkg.price.toLocaleString("en-IN")}`} bold />
        </View>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <TouchableOpacity testID="confirm-booking-btn" style={styles.cta} onPress={onConfirm} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Continue to Payment</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowK, bold && { color: colors.text, fontWeight: "600" }]}>{k}</Text>
      <Text style={[styles.rowV, bold && { fontSize: 17, color: colors.primary, fontWeight: "700" }]} numberOfLines={1}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  svcCard: { padding: 16, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, marginBottom: 22 },
  svcCat: { color: colors.primary, fontSize: 10, letterSpacing: 1.5, fontWeight: "700" },
  svcName: { color: colors.text, fontSize: 18, fontWeight: "600", marginTop: 4 },
  svcLoc: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  label: { color: colors.text, fontWeight: "600", fontSize: 14, marginBottom: 10, marginTop: 6 },
  pkgCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10, backgroundColor: "#fff" },
  pkgActive: { borderColor: colors.primary, backgroundColor: "#fff" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pkgName: { color: colors.text, fontSize: 15, fontWeight: "700" },
  pkgDesc: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  pkgPrice: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  dateBtn: { flexDirection: "row", gap: 10, alignItems: "center", height: 54, paddingHorizontal: 16, backgroundColor: colors.bgSoft, borderRadius: 14, marginBottom: 8 },
  dateText: { color: colors.text, fontSize: 14, fontWeight: "500" },
  input: { backgroundColor: colors.bgSoft, height: 52, borderRadius: 14, paddingHorizontal: 16, color: colors.text, fontSize: 14, marginBottom: 4 },
  summary: { padding: 18, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginTop: 22 },
  sumTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 12, fontFamily: "serif" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowK: { color: colors.textMuted, fontSize: 13 },
  rowV: { color: colors.text, fontSize: 13, maxWidth: "60%", textAlign: "right" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  err: { color: colors.primary, marginTop: 14, fontSize: 13 },
  cta: { marginTop: 22, height: 56, backgroundColor: colors.primary, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
