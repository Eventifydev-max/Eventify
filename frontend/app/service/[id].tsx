import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, TextInput, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, formatErr } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

const { width } = Dimensions.get("window");

export default function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/services/${id}`);
      setService(data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const submitReview = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/reviews", { service_id: id, rating, comment });
      setReviewModal(false);
      setComment(""); setRating(5);
      await load();
    } catch (e: any) {
      alert(formatErr(e));
    } finally { setSubmitting(false); }
  };

  if (loading || !service) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {service.images.map((img: string, i: number) => (
              <Image key={i} source={{ uri: img }} style={{ width, height: 320 }} />
            ))}
          </ScrollView>
          <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]} style={styles.topGrad} />
          <SafeAreaView edges={["top"]} style={styles.topBar}>
            <TouchableOpacity testID="back-btn" style={styles.iconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity testID="share-btn" style={styles.iconBtn}>
              <Ionicons name="heart-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Text style={styles.cat}>{service.category.toUpperCase()}</Text>
          <Text style={styles.name}>{service.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Ionicons name="location-outline" size={15} color={colors.textMuted} />
            <Text style={styles.loc}>{service.location}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={styles.metaText}>{service.rating?.toFixed(1)}</Text>
              <Text style={styles.metaSub}>({service.review_count} reviews)</Text>
            </View>
            <View style={styles.meta}>
              <Ionicons name="call-outline" size={14} color={colors.primary} />
              <Text style={styles.metaText}>{service.contact}</Text>
            </View>
          </View>

          <Text style={styles.section}>About</Text>
          <Text style={styles.desc}>{service.description}</Text>

          <Text style={styles.section}>Features</Text>
          <View style={styles.tagWrap}>
            {service.features?.map((f: string, i: number) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{f}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.section}>Packages</Text>
          {service.packages?.map((p: any, i: number) => (
            <View key={i} style={styles.pkg}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pkgName}>{p.name}</Text>
                <Text style={styles.pkgDesc}>{p.description}</Text>
              </View>
              <Text style={styles.pkgPrice}>₹{p.price.toLocaleString("en-IN")}</Text>
            </View>
          ))}

          <View style={styles.reviewHead}>
            <Text style={styles.section}>Reviews</Text>
            <TouchableOpacity testID="add-review-btn" onPress={() => setReviewModal(true)}>
              <Text style={styles.addReview}>+ Add Review</Text>
            </TouchableOpacity>
          </View>
          {service.reviews?.length === 0 ? (
            <Text style={styles.emptyR}>Be the first to review</Text>
          ) : (
            service.reviews?.map((r: any) => (
              <View key={r.id} style={styles.review}>
                <View style={styles.revAvatar}><Text style={styles.revAvatarT}>{r.user_name?.[0]?.toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.revName}>{r.user_name}</Text>
                    <View style={{ flexDirection: "row", gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <Ionicons key={n} name={n <= r.rating ? "star" : "star-outline"} size={12} color={colors.accent} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.revComment}>{r.comment}</Text>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <View>
          <Text style={styles.footPriceLabel}>Starts from</Text>
          <Text style={styles.footPrice}>₹{service.starting_price.toLocaleString("en-IN")}</Text>
        </View>
        <TouchableOpacity testID="book-now-btn" style={styles.bookBtn} onPress={() => router.push(`/booking/${service.id}`)}>
          <Text style={styles.bookBtnText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={reviewModal} animationType="slide" transparent onRequestClose={() => setReviewModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Share your experience</Text>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginVertical: 14 }}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} testID={`star-${n}`} onPress={() => setRating(n)}>
                  <Ionicons name={n <= rating ? "star" : "star-outline"} size={32} color={colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              testID="review-comment"
              style={styles.modalInput}
              placeholder="Write your review..."
              placeholderTextColor="#9b958d"
              multiline
              value={comment}
              onChangeText={setComment}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity testID="cancel-review-btn" style={[styles.modalBtn, { backgroundColor: colors.bgSoft }]} onPress={() => setReviewModal(false)}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="submit-review-btn" style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={submitReview} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 110 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  body: { padding: 22 },
  cat: { color: colors.primary, fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  name: { fontSize: 26, color: colors.text, fontWeight: "500", fontFamily: "serif", marginTop: 6 },
  loc: { color: colors.textMuted, fontSize: 14 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  metaSub: { color: colors.textMuted, fontSize: 12 },
  section: { fontSize: 18, color: colors.text, fontWeight: "600", fontFamily: "serif", marginTop: 22, marginBottom: 10 },
  desc: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: colors.bgSoft, alignItems: "center", justifyContent: "center" },
  tagText: { color: colors.text, fontSize: 12, fontWeight: "500" },
  pkg: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10, backgroundColor: "#fff" },
  pkgName: { color: colors.text, fontWeight: "700", fontSize: 15 },
  pkgDesc: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  pkgPrice: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  reviewHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addReview: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  emptyR: { color: colors.textMuted, fontSize: 13, fontStyle: "italic" },
  review: { flexDirection: "row", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  revAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSoft, alignItems: "center", justifyContent: "center" },
  revAvatarT: { color: colors.primary, fontWeight: "700" },
  revName: { color: colors.text, fontWeight: "600", fontSize: 13 },
  revComment: { color: colors.textMuted, marginTop: 4, fontSize: 13, lineHeight: 18 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 14, backgroundColor: "rgba(255,255,255,0.96)", borderTopWidth: 1, borderColor: colors.border },
  footPriceLabel: { color: colors.textMuted, fontSize: 11 },
  footPrice: { color: colors.primary, fontSize: 22, fontWeight: "700" },
  bookBtn: { flexDirection: "row", alignItems: "center", gap: 8, height: 52, paddingHorizontal: 26, borderRadius: 26, backgroundColor: colors.primary },
  bookBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: "600", color: colors.text, fontFamily: "serif", textAlign: "center" },
  modalInput: { backgroundColor: colors.bgSoft, borderRadius: 12, padding: 14, minHeight: 100, color: colors.text, textAlignVertical: "top" },
  modalBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
