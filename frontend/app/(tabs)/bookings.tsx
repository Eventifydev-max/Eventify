import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#2E7D32",
  pending_payment: "#C57B00",
  cancelled: "#9E2828",
};

export default function Bookings() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/bookings/me");
      setItems(data);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>All your reservations in one place</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyT}>No bookings yet</Text>
          <Text style={styles.emptyS}>Start exploring services to book your first one</Text>
          <TouchableOpacity testID="explore-btn" style={styles.exploreBtn} onPress={() => router.push("/(tabs)/search")}>
            <Text style={styles.exploreText}>Explore Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] || colors.textMuted;
            return (
              <TouchableOpacity
                testID={`booking-${item.id}`}
                style={styles.card}
                onPress={() => {
                  if (item.payment_status !== "paid") router.push(`/payment/${item.id}`);
                  else router.push(`/confirmation/${item.id}`);
                }}
              >
                <Image source={{ uri: item.service_image }} style={styles.img} />
                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={1}>{item.service_name}</Text>
                  <Text style={styles.cat}>{item.package_name} · {item.service_category}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.date}>{item.booking_date}</Text>
                  </View>
                  <View style={styles.foot}>
                    <Text style={styles.amount}>₹{item.amount.toLocaleString("en-IN")}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusColor + "15", borderColor: statusColor + "55" }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {item.status === "pending_payment" ? "Pay Now" : item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  title: { fontSize: 30, fontWeight: "500", color: colors.text, fontFamily: "serif" },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  img: { width: 110, height: 130 },
  body: { flex: 1, padding: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: "600" },
  cat: { color: colors.textMuted, fontSize: 12, marginTop: 4, textTransform: "capitalize" },
  date: { color: colors.textMuted, fontSize: 12 },
  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  amount: { color: colors.primary, fontSize: 17, fontWeight: "700" },
  statusPill: { paddingHorizontal: 10, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 10 },
  emptyT: { color: colors.text, fontSize: 20, fontWeight: "600", marginTop: 8 },
  emptyS: { color: colors.textMuted, textAlign: "center" },
  exploreBtn: { marginTop: 18, backgroundColor: colors.primary, paddingHorizontal: 26, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  exploreText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
