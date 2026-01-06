import { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Share2,
  Calendar,
  ShieldCheck,
  Download,
  AlertCircle,
  Trash2,
} from "lucide-react-native";
import { useTestResult, useTestResults } from "../../../lib/hooks";
import { Badge } from "../../../components/Badge";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { ShareModal } from "../../../components/ShareModal";
import type { STIResult } from "../../../lib/types";

export default function ResultDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { result, loading, error } = useTestResult(id);
  const { deleteResult } = useTestResults();
  const [showShareModal, setShowShareModal] = useState(false);

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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#923D5C" />
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-6 py-4">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-danger font-inter-semibold text-lg mb-2">
            Result Not Found
          </Text>
          <Text className="text-text-light font-inter-regular text-center">
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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-inter-semibold text-secondary-dark">
          Test Result
        </Text>
        <Pressable
          onPress={handleShare}
          className="bg-primary-light/50 p-2 rounded-xl"
        >
          <Share2 size={20} color="#923D5C" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        <Card className="mb-6 mt-4">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-text-light font-inter-medium text-sm uppercase tracking-wider mb-1">
                Test Type
              </Text>
              <Text className="text-2xl font-inter-bold text-secondary-dark">
                {result.test_type}
              </Text>
            </View>
            <Badge label={statusLabel} variant={statusVariant} />
          </View>

          <View className="flex-row gap-8 mb-6">
            <View>
              <Text className="text-text-light font-inter-medium text-xs mb-1">
                TEST DATE
              </Text>
              <View className="flex-row items-center">
                <Calendar size={14} color="#6B7280" />
                <Text className="text-text font-inter-semibold ml-1">
                  {formatDate(result.test_date)}
                </Text>
              </View>
            </View>
            <View>
              <Text className="text-text-light font-inter-medium text-xs mb-1">
                VERIFIED
              </Text>
              <View className="flex-row items-center">
                <ShieldCheck
                  size={14}
                  color={result.is_verified ? "#28A745" : "#9CA3AF"}
                />
                <Text
                  className={`font-inter-semibold ml-1 ${
                    result.is_verified ? "text-success" : "text-text-light"
                  }`}
                >
                  {result.is_verified ? "Yes" : "No"}
                </Text>
              </View>
            </View>
          </View>

          {result.file_name && (
            <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center">
              <Download size={18} color="#923D5C" />
              <Text
                className="text-primary font-inter-medium ml-2 flex-1"
                numberOfLines={1}
              >
                {result.file_name}
              </Text>
            </View>
          )}
        </Card>

        {result.sti_results && result.sti_results.length > 0 && (
          <>
            <Text className="text-lg font-inter-bold text-secondary-dark mb-4">
              Detailed Breakdown
            </Text>

            <View className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
              {result.sti_results.map((sti, index) => (
                <View key={sti.name}>
                  {index > 0 && <View className="h-[1px] bg-border mx-4" />}
                  <STILineItem
                    name={sti.name}
                    result={sti.result}
                    status={sti.status}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {result.notes && (
          <Card className="mb-6">
            <Text className="text-text-light font-inter-medium text-xs mb-2 uppercase tracking-wider">
              Notes
            </Text>
            <Text className="text-text font-inter-regular leading-5">
              {result.notes}
            </Text>
          </Card>
        )}

        <View className="bg-warning-light/30 p-5 rounded-3xl flex-row items-start mb-6">
          <AlertCircle size={20} color="#FFC107" />
          <Text className="ml-3 flex-1 text-text text-sm leading-5 font-inter-regular">
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

      <View className="p-6 bg-white border-t border-border">
        <Button label="Share This Result" onPress={handleShare} />
      </View>

      {id && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          testResultId={id}
        />
      )}
    </SafeAreaView>
  );
}

function STILineItem({
  name,
  result,
  status,
}: {
  name: string;
  result: string;
  status: STIResult["status"];
}) {
  const textColor =
    status === "negative"
      ? "text-success"
      : status === "positive"
      ? "text-danger"
      : "text-warning";

  return (
    <View className="flex-row items-center justify-between p-4">
      <Text className="text-text font-inter-medium">{name}</Text>
      <Text className={`${textColor} font-inter-semibold`}>{result}</Text>
    </View>
  );
}
