import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, formatErr } from "../src/lib/api";
import { useAuth } from "../src/lib/auth";
import { colors } from "../src/lib/theme";

export default function OtpScreen() {
  const router = useRouter();
  const { phone, role, isNew, demoOtp } = useLocalSearchParams<{ phone: string; role: "customer" | "vendor"; isNew: string; demoOtp?: string }>();
  const { setUserAndToken } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resendIn, setResendIn] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);
  const isVendor = role === "vendor";
  const isFirstTime = isNew === "1";

  useEffect(() => {
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (val: string, i: number) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (e: any, i: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const onVerify = async () => {
    setErr("");
    const code = otp.join("");
    if (code.length !== 6) { setErr("Please enter the 6-digit OTP"); return; }
    if (isFirstTime && !name.trim()) { setErr("Please enter your name"); return; }
    if (isFirstTime && isVendor && !businessName.trim()) { setErr("Please enter your business name"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", {
        phone, otp: code, role,
        name: isFirstTime ? name.trim() : undefined,
        business_name: isFirstTime && isVendor ? businessName.trim() : undefined,
      });
      await setUserAndToken(data.token, data.user);
      if (data.user.role === "vendor") router.replace("/(vendor)/dashboard");
      else router.replace("/(tabs)/home");
    } catch (e: any) {
      setErr(formatErr(e));
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setResendIn(30);
    try { await api.post("/auth/send-otp", { phone, role }); } catch {}
  };

  const autofill = () => {
    setOtp(["1", "2", "3", "4", "5", "6"]);
    inputs.current[5]?.focus();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.sub}>Enter the 6-digit code sent to{"\n"}<Text style={{ color: colors.text, fontWeight: "600" }}>+91 {phone}</Text></Text>

          <View style={styles.otpRow}>
            {otp.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r; }}
                testID={`otp-${i}`}
                style={[styles.otpBox, d && styles.otpBoxFilled]}
                value={d}
                onChangeText={(v) => handleChange(v, i)}
                onKeyPress={(e) => handleKey(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {!!demoOtp && (
            <TouchableOpacity testID="autofill-btn" style={styles.demoHint} onPress={autofill}>
              <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
              <Text style={styles.demoText}>Demo OTP: {demoOtp} · Tap to autofill</Text>
            </TouchableOpacity>
          )}

          {isFirstTime && (
            <View style={styles.newUserBlock}>
              <Text style={styles.label}>{isVendor ? "Your Name" : "Your Name"}</Text>
              <TextInput
                testID="name-input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={isVendor ? "Owner / Manager name" : "Riya Sharma"}
                placeholderTextColor="#9b958d"
              />
              {isVendor && (
                <>
                  <Text style={styles.label}>Business Name</Text>
                  <TextInput
                    testID="business-input"
                    style={styles.input}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="e.g., Royal Heritage Palace"
                    placeholderTextColor="#9b958d"
                  />
                </>
              )}
            </View>
          )}

          {err ? <Text testID="otp-error" style={styles.err}>{err}</Text> : null}

          <TouchableOpacity testID="verify-btn" style={styles.cta} onPress={onVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{isFirstTime ? "Create Account" : "Verify & Continue"}</Text>}
          </TouchableOpacity>

          <TouchableOpacity testID="resend-btn" onPress={resend} disabled={resendIn > 0} style={styles.resendRow}>
            <Text style={[styles.resendText, resendIn > 0 && { color: colors.textMuted }]}>
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 28, paddingBottom: 40 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 30, fontWeight: "500", color: colors.text, fontFamily: "serif" },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 26, lineHeight: 20 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  otpBox: { width: 48, height: 60, borderRadius: 14, backgroundColor: colors.bgSoft, textAlign: "center", color: colors.text, fontSize: 22, fontWeight: "700" },
  otpBoxFilled: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: colors.primary },
  demoHint: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", padding: 10, borderRadius: 10, backgroundColor: "#FFF6E0", borderWidth: 1, borderColor: "#F0D88A", marginTop: 10 },
  demoText: { color: "#7A5C00", fontSize: 12, fontWeight: "600" },
  newUserBlock: { marginTop: 22 },
  label: { color: colors.text, fontWeight: "600", fontSize: 13, marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: colors.bgSoft, height: 52, borderRadius: 12, paddingHorizontal: 16, color: colors.text, fontSize: 15 },
  err: { color: colors.primary, marginTop: 14, fontSize: 13 },
  cta: { marginTop: 22, height: 56, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  resendRow: { marginTop: 16, alignItems: "center" },
  resendText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
});
