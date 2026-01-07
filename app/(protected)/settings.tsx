import { View, Text, Pressable, ScrollView, SafeAreaView, Switch, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../context/auth";
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, ChevronLeft, Mail, Trash2, Activity } from "lucide-react-native";
import { useProfile } from "../../lib/hooks";
import { RiskAssessment } from "../../components/RiskAssessment";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { getNotificationsEnabled, setNotificationsEnabled, cancelAllReminderNotifications } from "../../lib/notifications";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/Button";

const RISK_LABELS = { low: "Low", moderate: "Moderate", high: "High" };

export default function Settings() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const [notifications, setNotifications] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
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
      "Delete All Data",
      "This will permanently delete all your test results, reminders, and share links. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            const userId = session?.user?.id;
            if (!userId) return;
            await supabase.from("share_links").delete().eq("user_id", userId);
            await supabase.from("test_results").delete().eq("user_id", userId);
            await supabase.from("reminders").delete().eq("user_id", userId);
            await cancelAllReminderNotifications();
            Alert.alert("Done", "All your data has been deleted.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-inter-semibold text-secondary-dark">Settings</Text>
        <View className="w-8" />
      </View>
      <ScrollView className="flex-1 px-6">
        <View className="items-center py-4">
          <View className="w-24 h-24 bg-primary-light rounded-full items-center justify-center mb-4">
            <User size={48} color="#923D5C" />
          </View>
          <Text className="text-2xl font-inter-bold text-secondary-dark">{displayName || session?.user?.email?.split('@')[0] || "User"}</Text>
          <View className="flex-row items-center mt-1">
            <Mail size={14} color="#6B7280" />
            <Text className="text-text-light font-inter-regular ml-2">{session?.user?.email}</Text>
          </View>
        </View>

        <Text className="text-lg font-inter-bold text-secondary-dark mb-4">Account</Text>
        
        <View className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
          <SettingsItem
            icon={<User size={20} color="#374151" />}
            title="Profile Information"
            showChevron
            onPress={() => setShowProfileModal(true)}
          />
          <View className="h-[1px] bg-border mx-4" />
          <SettingsItem 
            icon={<Bell size={20} color="#374151" />} 
            title="Push Notifications" 
            rightElement={
              <Switch 
                value={notifications} 
                onValueChange={handleToggleNotifications}
                trackColor={{ false: "#E0E0E0", true: "#923D5C" }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <Text className="text-lg font-inter-bold text-secondary-dark mb-4">Health</Text>

        <View className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
          <SettingsItem
            icon={<Activity size={20} color="#374151" />}
            title="Risk Assessment"
            onPress={() => setShowRiskAssessment(true)}
            rightElement={
              profile?.risk_level ? (
                <Text className="text-text-light font-inter-medium mr-2">
                  {RISK_LABELS[profile.risk_level]}
                </Text>
              ) : null
            }
            showChevron
          />
        </View>

        <Text className="text-lg font-inter-bold text-secondary-dark mb-4">Privacy & Data</Text>

        <View className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
          <SettingsItem
            icon={<Shield size={20} color="#374151" />}
            title="Privacy Policy"
            showChevron
          />
          <View className="h-[1px] bg-border mx-4" />
          <SettingsItem
            icon={<Trash2 size={20} color="#DC3545" />}
            title="Delete All Data"
            onPress={handleDeleteAllData}
            danger
          />
        </View>

        <Text className="text-lg font-inter-bold text-secondary-dark mb-4">Support</Text>
        
        <View className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
          <SettingsItem 
            icon={<HelpCircle size={20} color="#374151" />} 
            title="Help Center" 
            showChevron 
          />
        </View>

        <Pressable
          onPress={signOut}
          className="mb-12 flex-row items-center justify-center py-4 rounded-2xl border border-danger/10 bg-danger/5"
        >
          <LogOut size={18} color="#DC3545" />
          <Text className="text-danger font-inter-semibold ml-2">Sign Out</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showProfileModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Pressable onPress={() => setShowProfileModal(false)}>
                  <Text className="text-primary font-inter-medium">Cancel</Text>
                </Pressable>
                <Text className="text-xl font-inter-bold text-secondary-dark">Edit Profile</Text>
                <View className="w-12" />
              </View>
              <Text className="text-text-light font-inter-medium text-sm mb-2">Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                className="border border-border rounded-xl p-4 text-text font-inter-regular mb-6"
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
}: {
  icon: React.ReactNode;
  title: string;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between p-4 active:bg-gray-50">
      <View className="flex-row items-center flex-1">
        <View className={`p-2 rounded-xl mr-3 ${danger ? "bg-danger/10" : "bg-gray-100"}`}>
          {icon}
        </View>
        <Text className={`font-inter-medium flex-1 ${danger ? "text-danger" : "text-text"}`}>{title}</Text>
      </View>
      {rightElement}
      {showChevron && !rightElement && <ChevronRight size={18} color="#E0E0E0" />}
    </Pressable>
  );
}
