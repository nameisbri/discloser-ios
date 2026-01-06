import { View, Text, Pressable, ScrollView, SafeAreaView, Switch } from "react-native";
import { useAuth } from "../../context/auth";
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Mail, Lock } from "lucide-react-native";
import { useState } from "react";

export default function Settings() {
  const { signOut, session } = useAuth();
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="items-center py-8">
          <View className="w-24 h-24 bg-primary-light rounded-full items-center justify-center mb-4">
            <User size={48} color="#923D5C" />
          </View>
          <Text className="text-2xl font-inter-bold text-secondary-dark">{session?.user?.email?.split('@')[0] || "User"}</Text>
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
          />
          <View className="h-[1px] bg-border mx-4" />
          <SettingsItem 
            icon={<Bell size={20} color="#374151" />} 
            title="Push Notifications" 
            rightElement={
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: "#E0E0E0", true: "#923D5C" }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <Text className="text-lg font-inter-bold text-secondary-dark mb-4">Privacy & Security</Text>
        
        <View className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
          <SettingsItem 
            icon={<Shield size={20} color="#374151" />} 
            title="Data & Privacy" 
            showChevron 
          />
          <View className="h-[1px] bg-border mx-4" />
          <SettingsItem 
            icon={<Lock size={20} color="#374151" />} 
            title="Security Settings" 
            showChevron 
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
    </SafeAreaView>
  );
}

function SettingsItem({ 
  icon, 
  title, 
  showChevron, 
  rightElement 
}: { 
  icon: React.ReactNode, 
  title: string, 
  showChevron?: boolean,
  rightElement?: React.ReactNode 
}) {
  return (
    <Pressable className="flex-row items-center justify-between p-4 active:bg-gray-50">
      <View className="flex-row items-center flex-1">
        <View className="bg-gray-100 p-2 rounded-xl mr-3">
          {icon}
        </View>
        <Text className="text-text font-inter-medium flex-1">{title}</Text>
      </View>
      {rightElement}
      {showChevron && !rightElement && <ChevronRight size={18} color="#E0E0E0" />}
    </Pressable>
  );
}
