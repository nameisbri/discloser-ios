import { View, Text, Pressable, ScrollView, SafeAreaView, Switch, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../context/auth";
import { useTheme, ThemeMode } from "../../context/theme";
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, ChevronLeft, Mail, Trash2, Activity, Moon, Sun, Smartphone, Heart } from "lucide-react-native";
import { useProfile } from "../../lib/hooks";
import { RiskAssessment } from "../../components/RiskAssessment";
import { KnownConditionsModal } from "../../components/KnownConditionsModal";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { getNotificationsEnabled, setNotificationsEnabled, cancelAllReminderNotifications } from "../../lib/notifications";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/Button";

const RISK_LABELS = { low: "Chill", moderate: "Moderate", high: "Active" };

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Moon }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Smartphone },
];

export default function Settings() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const { profile, refetch: refetchProfile, addKnownCondition, removeKnownCondition } = useProfile();
  const { theme, setTheme, isDark } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [showKnownConditions, setShowKnownConditions] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifications);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session?.user?.id)
      .single();
    if (data?.display_name) setDisplayName(data.display_name);
  };

  const handleToggleNotifications = (value: boolean) => {
    setNotifications(value);
    setNotificationsEnabled(value);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", session?.user?.id);
    setSaving(false);
    setShowProfileModal(false);
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      "Start fresh?",
      "This wipes everything - results, reminders, links. No going back.",
      [
        { text: "Never mind", style: "cancel" },
        {
          text: "Wipe it all",
          style: "destructive",
          onPress: async () => {
            const userId = session?.user?.id;
            if (!userId) return;
            await supabase.from("share_links").delete().eq("user_id", userId);
            await supabase.from("test_results").delete().eq("user_id", userId);
            await supabase.from("reminders").delete().eq("user_id", userId);
            await cancelAllReminderNotifications();
            Alert.alert("Done", "Clean slate. You're good to go.");
          },
        },
      ]
    );
  };

  const currentThemeOption = THEME_OPTIONS.find(opt => opt.value === theme);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <View className="flex-row items-center px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
        <Text className={`flex-1 text-center text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Settings
        </Text>
        <View className="w-8" />
      </View>
      <ScrollView className="flex-1 px-6">
        <View className="items-center py-4">
          <View className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light"}`}>
            <User size={48} color={isDark ? "#FF2D7A" : "#923D5C"} />
          </View>
          <Text className={`text-2xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
            {displayName || session?.user?.email?.split('@')[0] || "User"}
          </Text>
          <View className="flex-row items-center mt-1">
            <Mail size={14} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />
            <Text className={`font-inter-regular ml-2 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
              {session?.user?.email}
            </Text>
          </View>
        </View>

        <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Appearance
        </Text>

        <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <SettingsItem
            icon={<Moon size={20} color={isDark ? "#FF2D7A" : "#374151"} />}
            title="Theme"
            onPress={() => setShowThemeModal(true)}
            rightElement={
              <Text className={`font-inter-medium mr-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                {currentThemeOption?.label}
              </Text>
            }
            showChevron
            isDark={isDark}
          />
        </View>

        <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Account
        </Text>
        
        <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <SettingsItem
            icon={<User size={20} color={isDark ? "#C9A0DC" : "#374151"} />}
            title="Profile Information"
            showChevron
            onPress={() => setShowProfileModal(true)}
            isDark={isDark}
          />
          <View className={`h-[1px] mx-4 ${isDark ? "bg-dark-border" : "bg-border"}`} />
          <SettingsItem 
            icon={<Bell size={20} color={isDark ? "#C9A0DC" : "#374151"} />} 
            title="Push Notifications" 
            rightElement={
              <Switch 
                value={notifications} 
                onValueChange={handleToggleNotifications}
                trackColor={{ false: isDark ? "#3D3548" : "#E0E0E0", true: isDark ? "#FF2D7A" : "#923D5C" }}
                thumbColor="#FFFFFF"
              />
            }
            isDark={isDark}
          />
        </View>

        <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Your vibe
        </Text>

        <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <SettingsItem
            icon={<Activity size={20} color={isDark ? "#00E5A0" : "#374151"} />}
            title="How often to test?"
            onPress={() => setShowRiskAssessment(true)}
            rightElement={
              profile?.risk_level ? (
                <Text className={`font-inter-medium mr-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                  {RISK_LABELS[profile.risk_level]}
                </Text>
              ) : null
            }
            showChevron
            isDark={isDark}
          />
        </View>

        <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Your status
        </Text>

        <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <SettingsItem
            icon={<Heart size={20} color={isDark ? "#C9A0DC" : "#7C3AED"} />}
            title="Known Conditions"
            onPress={() => setShowKnownConditions(true)}
            rightElement={
              (profile?.known_conditions?.length ?? 0) > 0 ? (
                <Text className={`font-inter-medium mr-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                  {profile?.known_conditions?.length}
                </Text>
              ) : null
            }
            showChevron
            isDark={isDark}
          />
        </View>

        <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Your data
        </Text>

        <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <SettingsItem
            icon={<Shield size={20} color={isDark ? "#C9A0DC" : "#374151"} />}
            title="Privacy Policy"
            showChevron
            isDark={isDark}
          />
          <View className={`h-[1px] mx-4 ${isDark ? "bg-dark-border" : "bg-border"}`} />
          <SettingsItem
            icon={<Trash2 size={20} color="#DC3545" />}
            title="Start fresh"
            onPress={handleDeleteAllData}
            danger
            isDark={isDark}
          />
        </View>

        <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Need help?
        </Text>

        <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <SettingsItem
            icon={<HelpCircle size={20} color={isDark ? "#C9A0DC" : "#374151"} />}
            title="Get support"
            showChevron
            isDark={isDark}
          />
        </View>

        <Pressable
          onPress={signOut}
          className={`mb-12 flex-row items-center justify-center py-4 rounded-2xl border ${isDark ? "border-danger/20 bg-danger/10" : "border-danger/10 bg-danger/5"}`}
        >
          <LogOut size={18} color="#DC3545" />
          <Text className="text-danger font-inter-semibold ml-2">Sign Out</Text>
        </Pressable>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal visible={showThemeModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className={`rounded-t-3xl p-6 ${isDark ? "bg-dark-surface" : "bg-white"}`}>
            <View className="flex-row justify-between items-center mb-6">
              <View className="w-12" />
              <Text className={`text-xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
                Pick your vibe
              </Text>
              <Pressable onPress={() => setShowThemeModal(false)}>
                <Text className={`font-inter-medium ${isDark ? "text-dark-accent" : "text-primary"}`}>Done</Text>
              </Pressable>
            </View>
            <View className="gap-3">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setTheme(option.value)}
                    className={`flex-row items-center p-4 rounded-2xl border-2 ${
                      isSelected
                        ? isDark
                          ? "bg-dark-accent-muted border-dark-accent"
                          : "bg-primary-muted border-primary"
                        : isDark
                        ? "bg-dark-surface-light border-dark-border"
                        : "bg-gray-50 border-border"
                    }`}
                  >
                    <View className={`p-2 rounded-xl mr-3 ${
                      isSelected
                        ? isDark ? "bg-dark-accent/20" : "bg-primary/10"
                        : isDark ? "bg-dark-surface" : "bg-gray-100"
                    }`}>
                      <Icon size={22} color={isSelected ? (isDark ? "#FF2D7A" : "#923D5C") : (isDark ? "#C9A0DC" : "#6B7280")} />
                    </View>
                    <Text className={`flex-1 font-inter-semibold ${
                      isSelected
                        ? isDark ? "text-dark-accent" : "text-primary"
                        : isDark ? "text-dark-text" : "text-text"
                    }`}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View className={`w-6 h-6 rounded-full items-center justify-center ${isDark ? "bg-dark-accent" : "bg-primary"}`}>
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <View className="h-8" />
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <View className="flex-1 bg-black/50 justify-end">
            <View className={`rounded-t-3xl p-6 ${isDark ? "bg-dark-surface" : "bg-white"}`}>
              <View className="flex-row justify-between items-center mb-6">
                <Pressable onPress={() => setShowProfileModal(false)}>
                  <Text className={`font-inter-medium ${isDark ? "text-dark-accent" : "text-primary"}`}>Cancel</Text>
                </Pressable>
                <Text className={`text-xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
                  Edit Profile
                </Text>
                <View className="w-12" />
              </View>
              <Text className={`font-inter-medium text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                Display Name
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                className={`border rounded-xl p-4 font-inter-regular mb-6 ${
                  isDark
                    ? "bg-dark-surface-light border-dark-border text-dark-text"
                    : "border-border text-text"
                }`}
              />
              <Button label={saving ? "Saving..." : "Save"} onPress={handleSaveProfile} disabled={saving} />
              <View className="h-8" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <RiskAssessment
        visible={showRiskAssessment}
        onClose={() => setShowRiskAssessment(false)}
        onComplete={() => refetchProfile()}
      />

      <KnownConditionsModal
        visible={showKnownConditions}
        onClose={() => setShowKnownConditions(false)}
        conditions={profile?.known_conditions || []}
        onAdd={addKnownCondition}
        onRemove={removeKnownCondition}
      />
    </SafeAreaView>
  );
}

function SettingsItem({
  icon,
  title,
  showChevron,
  rightElement,
  onPress,
  danger,
  isDark,
}: {
  icon: React.ReactNode;
  title: string;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  isDark?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between p-4 ${isDark ? "active:bg-dark-surface-light" : "active:bg-gray-50"}`}
    >
      <View className="flex-row items-center flex-1">
        <View className={`p-2 rounded-xl mr-3 ${
          danger
            ? isDark ? "bg-danger/20" : "bg-danger/10"
            : isDark ? "bg-dark-surface-light" : "bg-gray-100"
        }`}>
          {icon}
        </View>
        <Text className={`font-inter-medium flex-1 ${
          danger ? "text-danger" : isDark ? "text-dark-text" : "text-text"
        }`}>
          {title}
        </Text>
      </View>
      {rightElement}
      {showChevron && !rightElement && (
        <ChevronRight size={18} color={isDark ? "#3D3548" : "#E0E0E0"} />
      )}
    </Pressable>
  );
}
