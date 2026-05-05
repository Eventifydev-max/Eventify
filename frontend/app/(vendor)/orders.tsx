import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

export default function VendorOrders() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/bookings/vendor");
      setItems(data);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <Text style={styles.subtitle}>Customer reservations on your services</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyT}>No bookings yet</Text>
          <Text style={styles.emptyS}>Bookings will appear here once customers reserve your services</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const paid = item.payment_status === "paid";
            return (
              <View style={styles.card}>
                <Image source={{ uri: item.service_image }} style={styles.img} />
                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={1}>{item.service_name}</Text>
                  <Text style={styles.pkg}>{item.package_name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Ionicons name="person-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.meta}>{item.user_name}</Text>
                    <Text style={styles.meta}> · </Text>
                    <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.meta}>{item.user_phone}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.meta}>{item.booking_date}</Text>
                  </View>
                  <View style={styles.foot}>
                    <Text style={styles.amt}>₹{item.amount?.toLocaleString("en-IN")}</Text>
                    <View style={[styles.statusPill, { backgroundColor: paid ? "#E8F5E9" : "#FFF3E0", borderColor: paid ? "#A5D6A7" : "#FFCC80" }]}>
                      <View style={[styles.statusDot, { backgroundColor: paid ? colors.success : "#C57B00" }]} />
                      <Text style={[styles.statusText, { color: paid ? colors.success : "#C57B00" }]}>
                        {paid ? "PAID" : "PENDING"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
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
  img: { width: 100, height: 140 },
  body: { flex: 1, padding: 12 },
  name: { color: colors.text, fontSize: 15, fontWeight: "600" },
  pkg: { color: colors.primary, fontSize: 12, fontWeight: "600", marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: 11 },
  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  amt: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 24, borderRadius: 12, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 10 },
  emptyT: { color: colors.text, fontSize: 20, fontWeight: "600", marginTop: 8 },
  emptyS: { color: colors.textMuted, textAlign: "center" },
});
