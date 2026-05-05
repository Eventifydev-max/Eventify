import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, formatErr } from "../src/lib/api";
import { colors } from "../src/lib/theme";

export default function PhoneScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: "customer" | "vendor" }>();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const isVendor = role === "vendor";

  const onSend = async () => {
    setErr("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setErr("Please enter a valid 10-digit mobile number"); return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/send-otp", { phone: digits, role });
      router.push({
        pathname: "/otp",
        params: { phone: digits, role: role || "customer", isNew: data.is_new ? "1" : "0", demoOtp: data.demo_otp },
      });
    } catch (e: any) {
      setErr(formatErr(e));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.tag}>
            <Text style={styles.tagText}>{isVendor ? "VENDOR LOGIN" : "CUSTOMER LOGIN"}</Text>
          </View>

          <Text style={styles.title}>Enter your{"\n"}mobile number</Text>
          <Text style={styles.sub}>We'll send a 6-digit verification code via SMS</Text>

          <View style={styles.phoneRow}>
            <View style={styles.flag}>
              <Text style={styles.flagText}>🇮🇳  +91</Text>
            </View>
            <TextInput
              testID="phone-input"
              style={styles.phoneInput}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
              keyboardType="number-pad"
              placeholder="98765 43210"
              placeholderTextColor="#9b958d"
              maxLength={10}
              autoFocus
            />
          </View>

          {err ? <Text testID="phone-error" style={styles.err}>{err}</Text> : null}

          <TouchableOpacity testID="send-otp-btn" style={[styles.cta, phone.length !== 10 && styles.ctaDisabled]} onPress={onSend} disabled={loading || phone.length !== 10}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Send OTP</Text>}
          </TouchableOpacity>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.noteText}>Demo mode: OTP is always 123456</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 28, paddingBottom: 40 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", marginBottom: 12 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 12, height: 26, borderRadius: 13, backgroundColor: colors.bgSoft, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  tagText: { color: colors.primary, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: "500", color: colors.text, fontFamily: "serif", lineHeight: 38 },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 30 },
  phoneRow: { flexDirection: "row", gap: 10 },
  flag: { backgroundColor: colors.bgSoft, height: 56, borderRadius: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  flagText: { fontSize: 16, color: colors.text, fontWeight: "600" },
  phoneInput: { flex: 1, backgroundColor: colors.bgSoft, height: 56, borderRadius: 14, paddingHorizontal: 16, color: colors.text, fontSize: 18, fontWeight: "500", letterSpacing: 1 },
  err: { color: colors.primary, marginTop: 14, fontSize: 13 },
  cta: { marginTop: 26, height: 56, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16, letterSpacing: 0.4 },
  note: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, justifyContent: "center" },
  noteText: { color: colors.textMuted, fontSize: 12 },
});
