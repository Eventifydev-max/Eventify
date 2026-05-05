import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api, formatErr } from "../../src/lib/api";
import { colors } from "../../src/lib/theme";

const CATEGORIES = [
  { key: "garden", label: "Wedding Garden / Resort", icon: "leaf-outline" },
  { key: "pandit", label: "Pandit Service", icon: "flower-outline" },
  { key: "videographer", label: "Videographer / Photographer", icon: "videocam-outline" },
];

const DEFAULT_IMAGES: Record<string, string[]> = {
  garden: [
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=85",
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=900&q=85",
  ],
  pandit: ["https://images.unsplash.com/photo-1604608672516-f1b9b1eb8ba9?w=900&q=85"],
  videographer: ["https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?w=900&q=85"],
};

type Pkg = { name: string; price: string; description: string };

export default function AddListing() {
  const router = useRouter();
  const [category, setCategory] = useState("garden");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [packages, setPackages] = useState<Pkg[]>([{ name: "", price: "", description: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const updatePkg = (i: number, k: keyof Pkg, v: string) => {
    const next = [...packages]; next[i] = { ...next[i], [k]: v }; setPackages(next);
  };
  const addPkg = () => setPackages([...packages, { name: "", price: "", description: "" }]);
  const removePkg = (i: number) => setPackages(packages.filter((_, x) => x !== i));

  const onSubmit = async () => {
    setErr("");
    if (!name || !city || !location || !description) {
      setErr("Please fill all required fields"); return;
    }
    const pkgs = packages
      .filter((p) => p.name.trim() && p.price.trim())
      .map((p) => ({ name: p.name.trim(), price: parseInt(p.price), description: p.description.trim() || "" }));
    if (pkgs.length === 0) { setErr("Add at least one package"); return; }

    let images = imageUrls.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (images.length === 0) images = DEFAULT_IMAGES[category] || [];

    const featureArr = features.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      await api.post("/services", {
        category, name: name.trim(), city: city.trim(), location: location.trim(),
        contact: contact.trim(), description: description.trim(),
        images, features: featureArr, packages: pkgs,
        starting_price: Math.min(...pkgs.map((p) => p.price)),
      });
      Alert.alert("Listing Added", "Your service is now live on Shaadi Sewa!", [
        { text: "Great", onPress: () => router.replace("/(vendor)/listings") },
      ]);
    } catch (e: any) {
      setErr(formatErr(e));
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Listing</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Category *</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                testID={`cat-${c.key}`}
                style={[styles.catChip, category === c.key && styles.catChipActive]}
                onPress={() => setCategory(c.key)}
              >
                <Ionicons name={c.icon as any} size={14} color={category === c.key ? "#fff" : colors.text} />
                <Text style={[styles.catChipText, category === c.key && { color: "#fff" }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Business Name *">
            <TextInput testID="name-input" style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Royal Heritage Palace" placeholderTextColor="#9b958d" />
          </Field>
          <Field label="City *">
            <TextInput testID="city-input" style={styles.input} value={city} onChangeText={setCity} placeholder="e.g., Jaipur" placeholderTextColor="#9b958d" />
          </Field>
          <Field label="Full Location *">
            <TextInput testID="location-input" style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g., Civil Lines, Jaipur, Rajasthan" placeholderTextColor="#9b958d" />
          </Field>
          <Field label="Contact Number">
            <TextInput testID="contact-input" style={styles.input} value={contact} onChangeText={setContact} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor="#9b958d" />
          </Field>
          <Field label="Description *">
            <TextInput testID="desc-input" style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 12 }]} multiline value={description} onChangeText={setDescription} placeholder="Tell customers what makes your service special..." placeholderTextColor="#9b958d" />
          </Field>
          <Field label="Features (comma separated)" hint="e.g., Lawn, Catering, Parking, Bridal Room">
            <TextInput testID="features-input" style={styles.input} value={features} onChangeText={setFeatures} placeholder="Lawn, Catering, Parking" placeholderTextColor="#9b958d" />
          </Field>
          <Field label="Image URLs" hint="One per line or comma separated. Leave empty to use default images.">
            <TextInput testID="images-input" style={[styles.input, { height: 70, textAlignVertical: "top", paddingTop: 12 }]} multiline value={imageUrls} onChangeText={setImageUrls} placeholder="https://..." placeholderTextColor="#9b958d" />
          </Field>

          <Text style={[styles.section, { marginTop: 14 }]}>Packages *</Text>
          {packages.map((p, i) => (
            <View key={i} style={styles.pkgCard}>
              <View style={styles.pkgHead}>
                <Text style={styles.pkgIdx}>Package {i + 1}</Text>
                {packages.length > 1 && (
                  <TouchableOpacity testID={`pkg-remove-${i}`} onPress={() => removePkg(i)}>
                    <Ionicons name="close-circle" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput testID={`pkg-name-${i}`} style={styles.input} value={p.name} onChangeText={(v) => updatePkg(i, "name", v)} placeholder="Package name (e.g., Silver)" placeholderTextColor="#9b958d" />
              <TextInput testID={`pkg-price-${i}`} style={[styles.input, { marginTop: 8 }]} value={p.price} onChangeText={(v) => updatePkg(i, "price", v.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="Price in ₹ (e.g., 250000)" placeholderTextColor="#9b958d" />
              <TextInput testID={`pkg-desc-${i}`} style={[styles.input, { marginTop: 8 }]} value={p.description} onChangeText={(v) => updatePkg(i, "description", v)} placeholder="What's included" placeholderTextColor="#9b958d" />
            </View>
          ))}
          <TouchableOpacity testID="add-pkg-btn" style={styles.addPkg} onPress={addPkg}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addPkgText}>Add another package</Text>
          </TouchableOpacity>

          {err ? <Text style={styles.err}>{err}</Text> : null}

          <TouchableOpacity testID="publish-btn" style={styles.cta} onPress={onSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Publish Listing</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  section: { color: colors.text, fontSize: 16, fontWeight: "700", fontFamily: "serif", marginBottom: 10 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 38, borderRadius: 19, backgroundColor: colors.bgSoft },
  catChipActive: { backgroundColor: colors.primary },
  catChipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  label: { color: colors.text, fontWeight: "600", fontSize: 13, marginBottom: 6 },
  hint: { color: colors.textMuted, fontSize: 11, marginBottom: 6 },
  input: { backgroundColor: colors.bgSoft, height: 50, borderRadius: 12, paddingHorizontal: 14, color: colors.text, fontSize: 14 },
  pkgCard: { padding: 14, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  pkgHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  pkgIdx: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  addPkg: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, borderStyle: "dashed" },
  addPkgText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  err: { color: colors.primary, marginTop: 14, fontSize: 13 },
  cta: { marginTop: 22, height: 56, backgroundColor: colors.primary, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
