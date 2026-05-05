import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { colors } from "../../src/lib/theme";

export default function VendorProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace("/role-select");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatar}><Ionicons name="briefcase" size={28} color="#fff" /></View>
          <Text style={styles.business}>{user?.business_name || user?.name}</Text>
          <Text style={styles.role}>VENDOR</Text>
          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Ionicons name="person-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{user?.name}</Text>
            </View>
            <View style={styles.meta}>
              <Ionicons name="call-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>+91 {user?.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage</Text>
          <Row icon="storefront-outline" label="My Listings" onPress={() => router.push("/(vendor)/listings")} testID="row-listings" />
          <Row icon="add-circle-outline" label="Add New Listing" onPress={() => router.push("/(vendor)/add-listing")} testID="row-add-listing" />
          <Row icon="receipt-outline" label="Booking Orders" onPress={() => router.push("/(vendor)/orders")} testID="row-orders" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Row icon="help-circle-outline" label="Help Center" testID="row-help" />
          <Row icon="document-text-outline" label="Vendor Terms" testID="row-terms" />
        </View>

        <TouchableOpacity testID="logout-btn" style={styles.logout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.primary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.brand}>EVENTIFY · VENDOR · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, onPress, testID }: { icon: any; label: string; onPress?: () => void; testID?: string }) {
  return (
    <TouchableOpacity testID={testID} style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.6 : 1}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 30, fontWeight: "500", color: colors.text, fontFamily: "serif", marginBottom: 18 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 22, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  business: { color: colors.text, fontSize: 20, fontWeight: "600", fontFamily: "serif", textAlign: "center" },
  role: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginTop: 4 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border, width: "100%" },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: colors.textMuted, fontSize: 12 },
  section: { marginBottom: 22 },
  sectionTitle: { color: colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgSoft, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "500" },
  logout: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, height: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.primary, marginTop: 6 },
  logoutText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  brand: { textAlign: "center", color: colors.textMuted, fontSize: 11, letterSpacing: 2, marginTop: 20 },
});
