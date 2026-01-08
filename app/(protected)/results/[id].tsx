import { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Share2,
  Calendar,
  ShieldCheck,
  FileText,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react-native";
import { useTestResult, useTestResults } from "../../../lib/hooks";
import { useTheme } from "../../../context/theme";
import { Badge } from "../../../components/Badge";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { ShareModal } from "../../../components/ShareModal";
import { getSignedUrl } from "../../../lib/storage";
import type { STIResult } from "../../../lib/types";

export default function ResultDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { result, loading, error } = useTestResult(id);
  const { deleteResult } = useTestResults();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const handleViewFile = async () => {
    if (!result?.file_url) return;
    setLoadingImage(true);
    try {
      const url = await getSignedUrl(result.file_url, 3600);
      setImageUrl(url);
      setShowImagePreview(true);
    } catch {
      Alert.alert("Error", "Could not load file");
    } finally {
      setLoadingImage(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Result",
      "Are you sure you want to delete this test result? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (id) {
              const success = await deleteResult(id);
              if (success) {
                router.replace("/dashboard");
              } else {
                Alert.alert("Error", "Failed to delete result");
              }
            }
          },
        },
      ]
    );
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? "bg-dark-bg" : "bg-background"}`}>
        <ActivityIndicator size="large" color={isDark ? "#FF2D7A" : "#923D5C"} />
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
        <View className="flex-row items-center px-6 py-4">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-danger font-inter-semibold text-lg mb-2">
            Result Not Found
          </Text>
          <Text className={`font-inter-regular text-center ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
            {error || "This test result could not be loaded."}
          </Text>
          <Button
            label="Go Back"
            variant="secondary"
            onPress={() => router.back()}
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  const statusVariant =
    result.status === "negative"
      ? "success"
      : result.status === "positive"
      ? "danger"
      : "warning";

  const statusLabel =
    result.status.charAt(0).toUpperCase() + result.status.slice(1);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
        </Pressable>
        <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
          Test Result
        </Text>
        <Pressable
          onPress={handleShare}
          className={`p-2 rounded-xl ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/50"}`}
        >
          <Share2 size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        <Card className="mb-6 mt-4">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1 mr-4">
              <Text className={`font-inter-medium text-sm uppercase tracking-wider mb-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                Test Type
              </Text>
              <Text className={`text-2xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
                {result.test_type}
              </Text>
            </View>
            <Badge label={statusLabel} variant={statusVariant} />
          </View>

          <View className="flex-row gap-8 mb-6">
            <View>
              <Text className={`font-inter-medium text-xs mb-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                TEST DATE
              </Text>
              <View className="flex-row items-center">
                <Calendar size={14} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />
                <Text className={`font-inter-semibold ml-1 ${isDark ? "text-dark-text" : "text-text"}`}>
                  {formatDate(result.test_date)}
                </Text>
              </View>
            </View>
            <View>
              <Text className={`font-inter-medium text-xs mb-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                VERIFIED
              </Text>
              <View className="flex-row items-center">
                <ShieldCheck
                  size={14}
                  color={result.is_verified ? (isDark ? "#00E5A0" : "#28A745") : "#9CA3AF"}
                />
                <Text
                  className={`font-inter-semibold ml-1 ${
                    result.is_verified
                      ? isDark ? "text-dark-mint" : "text-success"
                      : isDark ? "text-dark-text-secondary" : "text-text-light"
                  }`}
                >
                  {result.is_verified ? "Yes" : "No"}
                </Text>
              </View>
            </View>
          </View>

          {result.file_name && (
            <Pressable
              onPress={handleViewFile}
              disabled={loadingImage}
              className={`rounded-2xl p-4 flex-row items-center ${isDark ? "bg-dark-surface-light active:bg-dark-surface-elevated" : "bg-gray-50 active:bg-gray-100"}`}
            >
              {loadingImage ? (
                <ActivityIndicator size="small" color={isDark ? "#FF2D7A" : "#923D5C"} />
              ) : (
                <FileText size={18} color={isDark ? "#FF2D7A" : "#923D5C"} />
              )}
              <Text
                className={`font-inter-medium ml-2 flex-1 ${isDark ? "text-dark-accent" : "text-primary"}`}
                numberOfLines={1}
              >
                {result.file_name}
              </Text>
              <Text className={`text-xs ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>Tap to view</Text>
            </Pressable>
          )}
        </Card>

        {result.sti_results && result.sti_results.length > 0 && (
          <>
            <Text className={`text-lg font-inter-bold mb-4 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              Detailed Breakdown
            </Text>

            <View className={`rounded-3xl border shadow-sm overflow-hidden mb-8 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
              {result.sti_results.map((sti, index) => (
                <View key={index}>
                  {index > 0 && <View className={`h-[1px] mx-4 ${isDark ? "bg-dark-border" : "bg-border"}`} />}
                  <STILineItem
                    name={sti.name}
                    result={sti.result}
                    status={sti.status}
                    isDark={isDark}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {result.notes && (
          <Card className="mb-6">
            <Text className={`font-inter-medium text-xs mb-2 uppercase tracking-wider ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
              Notes
            </Text>
            <Text className={`font-inter-regular leading-5 ${isDark ? "text-dark-text" : "text-text"}`}>
              {result.notes}
            </Text>
          </Card>
        )}

        <View className={`p-5 rounded-3xl flex-row items-start mb-6 ${isDark ? "bg-dark-warning-bg" : "bg-warning-light/30"}`}>
          <AlertCircle size={20} color="#FFC107" />
          <Text className={`ml-3 flex-1 text-sm leading-5 font-inter-regular ${isDark ? "text-dark-text" : "text-text"}`}>
            This result is for information purposes only. Always consult with a
            healthcare professional for medical advice.
          </Text>
        </View>

        <Pressable
          onPress={handleDelete}
          className="flex-row items-center justify-center py-4 mb-12"
        >
          <Trash2 size={18} color="#DC3545" />
          <Text className="text-danger font-inter-medium ml-2">
            Delete Result
          </Text>
        </Pressable>
      </ScrollView>

      <View className={`p-6 border-t ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
        <Button label="Share This Result" onPress={handleShare} />
      </View>

      {id && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          testResultId={id}
        />
      )}

      <Modal visible={showImagePreview} animationType="fade" transparent>
        <View className="flex-1 bg-black/90 justify-center items-center">
          <Pressable
            onPress={() => setShowImagePreview(false)}
            className="absolute top-12 right-4 p-2 bg-white/20 rounded-full z-10"
          >
            <X size={24} color="#fff" />
          </Pressable>
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-4/5"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function STILineItem({
  name,
  result,
  status,
  isDark,
}: {
  name: string;
  result: string;
  status: STIResult["status"];
  isDark: boolean;
}) {
  const textColor =
    status === "negative"
      ? isDark ? "text-dark-mint" : "text-success"
      : status === "positive"
      ? "text-danger"
      : isDark ? "text-dark-warning" : "text-warning";

  return (
    <View className="flex-row items-center justify-between p-4">
      <Text className={`font-inter-medium ${isDark ? "text-dark-text" : "text-text"}`}>{name}</Text>
      <Text className={`${textColor} font-inter-semibold`}>{result}</Text>
    </View>
  );
}
