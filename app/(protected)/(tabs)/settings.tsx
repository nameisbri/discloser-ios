import { View, Text, Pressable, ScrollView, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/auth";
import { useTheme, ThemeMode } from "../../../context/theme";
import { User, LogOut, ChevronRight, ChevronLeft, Trash2, Activity, Moon, Sun, Smartphone, Heart, Calendar, Clock } from "lucide-react-native";
import { useProfile, useTestResults, useReminders } from "../../../lib/hooks";
import { RiskAssessment } from "../../../components/RiskAssessment";
import { KnownConditionsModal } from "../../../components/KnownConditionsModal";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/Button";
import { hapticNotification } from "../../../lib/utils/haptics";
import { HeaderLogo } from "../../../components/HeaderLogo";
import { formatDate } from "../../../lib/utils/date";

const RISK_LABELS = { low: "Chill", moderate: "Moderate", high: "Active" };
const PRONOUNS_OPTIONS = ["he/him", "she/her", "they/them", "other"];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Moon }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Smartphone },
];

export default function Settings() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const { profile, refetch: refetchProfile, addKnownCondition, removeKnownCondition, updateManagementMethods } = useProfile();
  const { results } = useTestResults();
  const { activeReminders } = useReminders();
  const { theme, setTheme, isDark } = useTheme();

  // Compute stats — keep as YYYY-MM-DD strings to avoid UTC timezone shift
  const lastTestDateStr = results.length > 0
    ? results.sort((a, b) => b.test_date.localeCompare(a.test_date))[0].test_date
    : null;
  const nextReminderStr = activeReminders.length > 0
    ? activeReminders.sort((a, b) => a.next_date.localeCompare(b.next_date))[0].next_date
    : null;
  const testingFrequency = profile?.risk_level
    ? { low: "Yearly", moderate: "Every 6 mo", high: "Every 3 mo" }[profile.risk_level]
    : null;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [showKnownConditions, setShowKnownConditions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [alias, setAlias] = useState("");
  const [dob, setDob] = useState("");
  const [pronouns, setPronouns] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setAlias(profile.alias || "");
      setDob(profile.date_of_birth || "");
      setPronouns(profile.pronouns || "");
    }
  }, [profile]);

  const validateProfile = () => {
    if (!firstName.trim()) {
      Alert.alert("Required", "Please enter your first name");
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert("Required", "Please enter your last name");
      return false;
    }
    if (!alias.trim()) {
      Alert.alert("Required", "Please choose an alias");
      return false;
    }
    if (!dob.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert("Required", "Please enter date of birth (YYYY-MM-DD)");
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    if (!session?.user?.id) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from("profiles") as any)
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        alias: alias.trim(),
        date_of_birth: dob,
        pronouns: pronouns || null,
      })
      .eq("id", session.user.id);

    if (error) {
      if (error.code === "23505") {
        Alert.alert("Alias Taken", "This alias is already in use.");
      } else {
        Alert.alert("Couldn't Save", "Something went wrong while saving your profile. Please try again.");
      }
      setSaving(false);
      return;
    }
    await refetchProfile();
    setSaving(false);
    setShowProfileModal(false);
  };

  const handleDeleteAllData = async () => {
    await hapticNotification("warning");
    Alert.alert(
      "Start fresh?",
      "This wipes everything - results, reminders, links, and your profile. You'll go through setup again.",
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
            // Reset profile to trigger onboarding again
            // @ts-expect-error - Supabase types not generated, runtime types are correct
            await supabase.from("profiles").update({
              first_name: null,
              last_name: null,
              alias: null,
              date_of_birth: null,
              pronouns: null,
              display_name: null,
              risk_level: null,
              risk_assessed_at: null,
              known_conditions: [],
              onboarding_completed: false,
            }).eq("id", userId);
            // Sign out to force re-authentication and onboarding flow
            await signOut();
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
        <HeaderLogo />
      </View>
      <ScrollView className="flex-1 px-6">
        {/* Stats Header */}
        <View className={`rounded-3xl p-4 mb-6 mt-2 ${isDark ? "bg-dark-surface" : "bg-white"} border ${isDark ? "border-dark-border" : "border-border"}`}>
          <View className="flex-row items-center mb-4">
            <View className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? "bg-dark-accent-muted" : "bg-primary-light"}`}>
              <Text className={`text-lg font-inter-bold ${isDark ? "text-dark-accent" : "text-primary"}`}>
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
                  : profile?.first_name?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className={`text-lg font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : "User"}
              </Text>
              {profile?.alias && (
                <Text className={`text-sm ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                  @{profile.alias}
                </Text>
              )}
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className={`flex-1 p-3 rounded-2xl ${isDark ? "bg-dark-surface-light" : "bg-gray-50"}`}>
              <View className="flex-row items-center mb-1">
                <Calendar size={14} color={isDark ? "#00E5A0" : "#10B981"} />
                <Text className={`text-xs ml-1 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>Last test</Text>
              </View>
              <Text className={`font-inter-semibold ${isDark ? "text-dark-text" : "text-text"}`}>
                {lastTestDateStr
                  ? formatDate(lastTestDateStr).replace(/, \d{4}$/, "")
                  : "None yet"}
              </Text>
            </View>

            <View className={`flex-1 p-3 rounded-2xl ${isDark ? "bg-dark-surface-light" : "bg-gray-50"}`}>
              <View className="flex-row items-center mb-1">
                <Clock size={14} color={isDark ? "#FF2D7A" : "#923D5C"} />
                <Text className={`text-xs ml-1 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>Next due</Text>
              </View>
              <Text className={`font-inter-semibold ${isDark ? "text-dark-text" : "text-text"}`}>
                {nextReminderStr
                  ? formatDate(nextReminderStr).replace(/, \d{4}$/, "")
                  : "Not set"}
              </Text>
            </View>

            <View className={`flex-1 p-3 rounded-2xl ${isDark ? "bg-dark-surface-light" : "bg-gray-50"}`}>
              <View className="flex-row items-center mb-1">
                <Activity size={14} color={isDark ? "#C9A0DC" : "#7C3AED"} />
                <Text className={`text-xs ml-1 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>Frequency</Text>
              </View>
              <Text className={`font-inter-semibold ${isDark ? "text-dark-text" : "text-text"}`}>
                {testingFrequency || "Not set"}
              </Text>
            </View>
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
            title="Managed Conditions"
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
          Danger zone
        </Text>

        <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <SettingsItem
            icon={<Trash2 size={20} color="#DC3545" />}
            title="Start fresh"
            onPress={handleDeleteAllData}
            danger
            isDark={isDark}
            accessibilityHint="Permanently deletes all your data"
          />
        </View>

        <Pressable
          onPress={async () => {
            await hapticNotification("warning");
            signOut();
          }}
          className={`mb-12 flex-row items-center justify-center py-4 rounded-2xl border ${isDark ? "border-danger/20 bg-danger/10" : "border-danger/10 bg-danger/5"}`}
          accessibilityLabel="Sign Out"
          accessibilityRole="button"
          accessibilityHint="Signs you out of the app"
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
            <ScrollView className={`rounded-t-3xl max-h-[85%] ${isDark ? "bg-dark-surface" : "bg-white"}`}>
              <View className="p-6">
                <View className="flex-row justify-between items-center mb-6">
                  <Pressable onPress={() => setShowProfileModal(false)}>
                    <Text className={`font-inter-medium ${isDark ? "text-dark-accent" : "text-primary"}`}>Cancel</Text>
                  </Pressable>
                  <Text className={`text-xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
                    Edit Profile
                  </Text>
                  <View className="w-12" />
                </View>

                <View className="gap-4">
                  <View>
                    <Text className={`font-inter-medium text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                      First Name <Text className="text-danger">*</Text>
                    </Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Enter first name"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                      className={`border rounded-xl p-4 font-inter-regular ${isDark ? "bg-dark-surface-light border-dark-border text-dark-text" : "border-border text-text"}`}
                    />
                  </View>

                  <View>
                    <Text className={`font-inter-medium text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                      Last Name <Text className="text-danger">*</Text>
                    </Text>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Enter last name"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                      className={`border rounded-xl p-4 font-inter-regular ${isDark ? "bg-dark-surface-light border-dark-border text-dark-text" : "border-border text-text"}`}
                    />
                  </View>

                  <View>
                    <Text className={`font-inter-medium text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                      Alias <Text className="text-danger">*</Text>
                    </Text>
                    <TextInput
                      value={alias}
                      onChangeText={setAlias}
                      placeholder="Choose an alias"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                      autoCapitalize="none"
                      className={`border rounded-xl p-4 font-inter-regular ${isDark ? "bg-dark-surface-light border-dark-border text-dark-text" : "border-border text-text"}`}
                    />
                  </View>

                  <View>
                    <Text className={`font-inter-medium text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                      Date of Birth <Text className="text-danger">*</Text>
                    </Text>
                    <TextInput
                      value={dob}
                      onChangeText={setDob}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                      keyboardType="numbers-and-punctuation"
                      className={`border rounded-xl p-4 font-inter-regular ${isDark ? "bg-dark-surface-light border-dark-border text-dark-text" : "border-border text-text"}`}
                    />
                  </View>

                  <View>
                    <Text className={`font-inter-medium text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                      Pronouns
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {PRONOUNS_OPTIONS.map((p) => {
                        const isOther = p === "other";
                        const isSelected = isOther
                          ? pronouns !== "" && !["he/him", "she/her", "they/them"].includes(pronouns)
                          : pronouns === p;
                        return (
                          <Pressable
                            key={p}
                            onPress={() => setPronouns(isSelected && !isOther ? "" : (isOther ? "other" : p))}
                            className={`px-4 py-2 rounded-full border ${
                              isSelected
                                ? isDark ? "bg-dark-accent border-dark-accent" : "bg-primary border-primary"
                                : isDark ? "bg-dark-surface-light border-dark-border" : "bg-gray-50 border-border"
                            }`}
                          >
                            <Text className={isSelected ? "text-white font-inter-semibold" : isDark ? "text-dark-text" : "text-text"}>
                              {p}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {pronouns !== "" && !["he/him", "she/her", "they/them", ""].includes(pronouns) && (
                      <TextInput
                        value={pronouns === "other" ? "" : pronouns}
                        onChangeText={setPronouns}
                        placeholder="Enter your pronouns"
                        placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                        autoCapitalize="none"
                        className={`mt-3 border rounded-xl p-4 font-inter-regular ${isDark ? "bg-dark-surface-light border-dark-border text-dark-text" : "border-border text-text"}`}
                      />
                    )}
                  </View>
                </View>

                <View className="mt-6">
                  <Button label={saving ? "Saving..." : "Save"} onPress={handleSaveProfile} disabled={saving} />
                </View>
                <View className="h-8" />
              </View>
            </ScrollView>
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
        onUpdateMethods={updateManagementMethods}
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
  accessibilityHint,
}: {
  icon: React.ReactNode;
  title: string;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  isDark?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between p-4 ${isDark ? "active:bg-dark-surface-light" : "active:bg-gray-50"}`}
      accessibilityLabel={title}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityHint={accessibilityHint}
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
