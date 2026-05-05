import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, RefreshControl, ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth";
import { colors } from "../../src/lib/theme";

const CATEGORIES = [
  { key: "garden", label: "Gardens & Resorts", hindi: "वेडिंग वेन्यू", icon: "leaf-outline", img: "https://images.unsplash.com/photo-1767050248590-98007e69d969?crop=entropy&cs=srgb&fm=jpg&q=85" },
  { key: "pandit", label: "Pandits", hindi: "पंडित जी", icon: "flower-outline", img: "https://images.unsplash.com/photo-1759674889222-22ea8f9d33e2?crop=entropy&cs=srgb&fm=jpg&q=85" },
  { key: "videographer", label: "Videographers", hindi: "वीडियोग्राफर", icon: "videocam-outline", img: "https://images.pexels.com/photos/29261299/pexels-photo-29261299.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/services/featured");
      setFeatured(data);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Namaste 🙏</Text>
            <Text style={styles.userName}>{user?.name?.split(" ")[0]}</Text>
          </View>
          <TouchableOpacity testID="profile-btn" style={styles.avatar} onPress={() => router.push("/(tabs)/profile")}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "U"}</Text>
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1722952934661-dde241aeb591?crop=entropy&cs=srgb&fm=jpg&q=85" }}
          style={styles.hero}
          imageStyle={{ borderRadius: 20 }}
        >
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.78)"]} style={styles.heroGrad}>
            <Text style={styles.heroBrand}>EVENTIFY</Text>
            <Text style={styles.heroTitle}>Plan your{"\n"}perfect event</Text>
            <TouchableOpacity testID="hero-explore-btn" style={styles.heroBtn} onPress={() => router.push("/(tabs)/search")}>
              <Text style={styles.heroBtnText}>Explore Services</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        </ImageBackground>

        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.bento}>
          <TouchableOpacity
            testID="cat-garden"
            style={[styles.bentoBig]}
            onPress={() => router.push({ pathname: "/(tabs)/search", params: { category: "garden" } })}
          >
            <ImageBackground source={{ uri: CATEGORIES[0].img }} style={styles.bentoImg} imageStyle={{ borderRadius: 18 }}>
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.bentoGrad}>
                <Ionicons name="leaf-outline" size={22} color={colors.accent} />
                <Text style={styles.bentoLabel}>Gardens & Resorts</Text>
                <Text style={styles.bentoHindi}>वेडिंग वेन्यू</Text>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.bentoRow}>
            {CATEGORIES.slice(1).map((c) => (
              <TouchableOpacity
                key={c.key}
                testID={`cat-${c.key}`}
                style={styles.bentoSmall}
                onPress={() => router.push({ pathname: "/(tabs)/search", params: { category: c.key } })}
              >
                <ImageBackground source={{ uri: c.img }} style={styles.bentoImg} imageStyle={{ borderRadius: 18 }}>
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.78)"]} style={styles.bentoGrad}>
                    <Ionicons name={c.icon as any} size={20} color={colors.accent} />
                    <Text style={[styles.bentoLabel, { fontSize: 16 }]}>{c.label}</Text>
                    <Text style={styles.bentoHindi}>{c.hindi}</Text>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <TouchableOpacity testID="see-all-btn" onPress={() => router.push("/(tabs)/search")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {featured.map((s) => (
              <TouchableOpacity
                key={s.id}
                testID={`featured-${s.id}`}
                style={styles.fCard}
                onPress={() => router.push(`/service/${s.id}`)}
              >
                <Image source={{ uri: s.images?.[0] }} style={styles.fImg} />
                <View style={styles.fBody}>
                  <Text style={styles.fName} numberOfLines={1}>{s.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.fLoc} numberOfLines={1}>{s.location}</Text>
                  </View>
                  <View style={styles.fFoot}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Ionicons name="star" size={12} color={colors.accent} />
                      <Text style={styles.fRating}>{s.rating?.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.fPrice}>₹{(s.starting_price / 1000).toFixed(0)}k+</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  greeting: { color: colors.textMuted, fontSize: 13 },
  userName: { color: colors.text, fontSize: 22, fontWeight: "600", fontFamily: "serif" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hero: { height: 220, marginHorizontal: 20, marginBottom: 24, justifyContent: "flex-end" },
  heroGrad: { borderRadius: 20, padding: 20 },
  heroBrand: { color: colors.accent, letterSpacing: 3, fontSize: 10, fontWeight: "700" },
  heroTitle: { color: "#fff", fontSize: 28, lineHeight: 32, fontFamily: "serif", marginTop: 6, marginBottom: 14 },
  heroBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, alignSelf: "flex-start", paddingHorizontal: 18, height: 42, borderRadius: 24 },
  heroBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  sectionTitle: { fontSize: 22, fontWeight: "500", color: colors.text, fontFamily: "serif", paddingHorizontal: 20, marginBottom: 14 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24 },
  seeAll: { color: colors.primary, fontWeight: "600", paddingRight: 20, fontSize: 14 },
  bento: { paddingHorizontal: 20, gap: 12 },
  bentoBig: { height: 140 },
  bentoImg: { flex: 1, justifyContent: "flex-end" },
  bentoGrad: { borderRadius: 18, padding: 14, justifyContent: "flex-end", height: "100%" },
  bentoRow: { flexDirection: "row", gap: 12 },
  bentoSmall: { flex: 1, height: 130 },
  bentoLabel: { color: "#fff", fontWeight: "600", fontSize: 18, marginTop: 4 },
  bentoHindi: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  fCard: { width: 220, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  fImg: { width: "100%", height: 130 },
  fBody: { padding: 12 },
  fName: { fontSize: 15, fontWeight: "600", color: colors.text },
  fLoc: { color: colors.textMuted, fontSize: 12, flex: 1 },
  fFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  fRating: { color: colors.text, fontWeight: "600", fontSize: 12 },
  fPrice: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
