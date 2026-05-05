import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth";
import { colors } from "../../src/lib/theme";

export default function VendorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([api.get("/services/mine"), api.get("/bookings/vendor")]);
      setListings(a.data); setBookings(b.data);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const totalRevenue = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((s, b) => s + (b.amount || 0), 0);
  const pendingPayments = bookings.filter((b) => b.payment_status !== "paid").length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Namaste 🙏</Text>
            <Text style={styles.business} numberOfLines={1}>{user?.business_name || user?.name}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="briefcase" size={14} color="#fff" />
            <Text style={styles.badgeText}>VENDOR</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.stat, { backgroundColor: colors.primary }]}>
                <Text style={styles.statLabel}>Earnings</Text>
                <Text style={styles.statValue}>₹{(totalRevenue / 1000).toFixed(0)}k</Text>
                <Text style={styles.statHint}>Total revenue</Text>
              </View>
              <View style={[styles.stat, { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Bookings</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{bookings.length}</Text>
                <Text style={[styles.statHint, { color: colors.textMuted }]}>{pendingPayments} pending</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statSm, { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border }]}>
                <Ionicons name="storefront-outline" size={20} color={colors.primary} />
                <Text style={styles.smValue}>{listings.length}</Text>
                <Text style={styles.smLabel}>Listings</Text>
              </View>
              <View style={[styles.statSm, { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border }]}>
                <Ionicons name="star-outline" size={20} color={colors.accent} />
                <Text style={styles.smValue}>{listings.length ? (listings.reduce((s, l) => s + (l.rating || 0), 0) / listings.length).toFixed(1) : "—"}</Text>
                <Text style={styles.smLabel}>Avg Rating</Text>
              </View>
              <View style={[styles.statSm, { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border }]}>
                <Ionicons name="eye-outline" size={20} color={colors.success} />
                <Text style={styles.smValue}>{listings.reduce((s, l) => s + (l.review_count || 0), 0)}</Text>
                <Text style={styles.smLabel}>Reviews</Text>
              </View>
            </View>

            <TouchableOpacity testID="add-listing-cta" style={styles.addCta} onPress={() => router.push("/(vendor)/add-listing")}>
              <View style={styles.addIcon}><Ionicons name="add" size={22} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addTitle}>Add New Listing</Text>
                <Text style={styles.addSub}>List your venue, services or studio</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity testID="all-bookings-btn" onPress={() => router.push("/(vendor)/orders")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {bookings.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyText}>No bookings yet. Add a listing to start earning!</Text>
              </View>
            ) : (
              bookings.slice(0, 4).map((b) => (
                <View key={b.id} style={styles.bRow}>
                  <View style={styles.bDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bName} numberOfLines={1}>{b.service_name}</Text>
                    <Text style={styles.bMeta}>{b.user_name} · {b.booking_date}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.bAmt}>₹{b.amount?.toLocaleString("en-IN")}</Text>
                    <Text style={[styles.bStatus, { color: b.payment_status === "paid" ? colors.success : "#C57B00" }]}>
                      {b.payment_status === "paid" ? "PAID" : "PENDING"}
                    </Text>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 30 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 14, gap: 12 },
  greeting: { color: colors.textMuted, fontSize: 13 },
  business: { color: colors.text, fontSize: 22, fontWeight: "600", fontFamily: "serif" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: colors.primary },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  stat: { flex: 1, padding: 18, borderRadius: 18 },
  statLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "500" },
  statValue: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 6, fontFamily: "serif" },
  statHint: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 4 },
  statSm: { flex: 1, padding: 14, borderRadius: 14, alignItems: "center", gap: 4 },
  smValue: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 2 },
  smLabel: { color: colors.textMuted, fontSize: 11 },
  addCta: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, marginHorizontal: 20, marginTop: 10, marginBottom: 6, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  addIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  addTitle: { color: colors.text, fontSize: 15, fontWeight: "600" },
  addSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, marginTop: 22, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.text, fontFamily: "serif" },
  seeAll: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  empty: { alignItems: "center", padding: 30, gap: 10 },
  emptyText: { color: colors.textMuted, textAlign: "center", fontSize: 13 },
  bRow: { flexDirection: "row", alignItems: "center", padding: 14, marginHorizontal: 20, marginBottom: 8, gap: 12, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  bDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  bName: { color: colors.text, fontSize: 14, fontWeight: "600" },
  bMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  bAmt: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  bStatus: { fontSize: 10, fontWeight: "800", marginTop: 2, letterSpacing: 0.5 },
});
