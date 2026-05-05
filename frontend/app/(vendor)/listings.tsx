import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api, formatErr } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

export default function VendorListings() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/services/mine");
      setItems(data);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onDelete = (id: string, name: string) => {
    Alert.alert("Delete listing?", `"${name}" will be permanently removed.`, [
      { text: "Cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await api.delete(`/services/${id}`); load(); }
          catch (e: any) { Alert.alert("Error", formatErr(e)); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My Listings</Text>
          <Text style={styles.subtitle}>{items.length} active</Text>
        </View>
        <TouchableOpacity testID="add-btn" style={styles.addBtn} onPress={() => router.push("/(vendor)/add-listing")}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="storefront-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyT}>No listings yet</Text>
          <Text style={styles.emptyS}>Add your first listing to start receiving bookings</Text>
          <TouchableOpacity testID="empty-add-btn" style={styles.emptyCta} onPress={() => router.push("/(vendor)/add-listing")}>
            <Text style={styles.emptyCtaText}>+ Add Listing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.images?.[0] }} style={styles.img} />
              <View style={styles.body}>
                <View style={styles.catPill}><Text style={styles.catPillText}>{item.category.toUpperCase()}</Text></View>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.loc} numberOfLines={1}>{item.location}</Text>
                <View style={styles.foot}>
                  <Text style={styles.price}>₹{item.starting_price.toLocaleString("en-IN")}+</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity testID={`view-${item.id}`} style={styles.iconBtn} onPress={() => router.push(`/service/${item.id}`)}>
                      <Ionicons name="eye-outline" size={16} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity testID={`del-${item.id}`} style={[styles.iconBtn, { backgroundColor: "#fce8e8" }]} onPress={() => onDelete(item.id, item.name)}>
                      <Ionicons name="trash-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, gap: 12 },
  title: { fontSize: 30, fontWeight: "500", color: colors.text, fontFamily: "serif" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  img: { width: 110, height: 130 },
  body: { flex: 1, padding: 12 },
  catPill: { alignSelf: "flex-start", paddingHorizontal: 8, height: 20, borderRadius: 10, backgroundColor: colors.bgSoft, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  catPillText: { color: colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: "600" },
  loc: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  price: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgSoft, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 10 },
  emptyT: { color: colors.text, fontSize: 20, fontWeight: "600", marginTop: 8 },
  emptyS: { color: colors.textMuted, textAlign: "center" },
  emptyCta: { marginTop: 18, backgroundColor: colors.primary, paddingHorizontal: 26, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyCtaText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
