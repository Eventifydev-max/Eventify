import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Platform-aware storage: localStorage on web, AsyncStorage on native.
// Avoids "Native module is null" error when running Expo on web browser.
const isWeb = Platform.OS === "web";

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      } catch {}
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      try {
        if (typeof window !== "undefined") window.localStorage.removeItem(key);
      } catch {}
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};
