import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "garden", label: "Gardens" },
  { key: "pandit", label: "Pandits" },
  { key: "videographer", label: "Videographers" },
];

export default function Search() {
  const params = useLocalSearchParams<{ category?: string }>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>(params.category || "all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const cat = active === "all" ? undefined : active;
      const { data } = await api.get("/services", { params: { category: cat, q: query || undefined } });
      setItems(data);
    } finally { setLoading(false); }
  }, [active, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { if (params.category) setActive(params.category); }, [params.category]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Find the perfect match for your big day</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          testID="search-input"
          style={styles.searchInput}
          placeholder="Search venues, pandits, videographers..."
          placeholderTextColor="#9b958d"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={fetchData}
          returnKeyType="search"
        />
        {!!query && (
          <TouchableOpacity onPress={() => { setQuery(""); }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            testID={`filter-${f.key}`}
            style={[styles.chip, active === f.key && styles.chipActive]}
            onPress={() => setActive(f.key)}
          >
            <Text style={[styles.chipText, active === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 50 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={42} color={colors.textMuted} />
          <Text style={styles.emptyText}>No services found. Try a different search.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity testID={`service-${item.id}`} style={styles.card} onPress={() => router.push(`/service/${item.id}`)}>
              <Image source={{ uri: item.images?.[0] }} style={styles.cardImg} />
              <View style={styles.cardBody}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={11} color={colors.accent} />
                    <Text style={styles.ratingText}>{item.rating?.toFixed(1)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.cardLoc}>{item.location}</Text>
                </View>
                <View style={styles.cardFoot}>
                  <Text style={styles.cardPriceLabel}>Starting at</Text>
                  <Text style={styles.cardPrice}>₹{item.starting_price.toLocaleString("en-IN")}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
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
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, paddingHorizontal: 14, height: 48, backgroundColor: colors.bgSoft, borderRadius: 14 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  chipRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, backgroundColor: colors.bgSoft, alignItems: "center", justifyContent: "center", marginRight: 8 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  cardImg: { width: "100%", height: 170 },
  cardBody: { padding: 14 },
  cardName: { flex: 1, color: colors.text, fontSize: 17, fontWeight: "600" },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, height: 24, backgroundColor: colors.bgSoft, borderRadius: 12 },
  ratingText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  cardLoc: { color: colors.textMuted, fontSize: 13 },
  cardFoot: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 12 },
  cardPriceLabel: { color: colors.textMuted, fontSize: 12 },
  cardPrice: { color: colors.primary, fontSize: 18, fontWeight: "700" },
  empty: { alignItems: "center", marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyText: { color: colors.textMuted, textAlign: "center" },
});
