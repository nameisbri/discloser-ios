import { View, Text, SafeAreaView, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Share2,
  Calendar,
  ShieldCheck,
  Download,
  AlertCircle,
} from "lucide-react-native";
import { Badge } from "../../../components/Badge";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";

export default function ResultDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-inter-semibold text-secondary-dark">
          Test Result
        </Text>
        <Pressable className="bg-primary-light/50 p-2 rounded-xl">
          <Share2 size={20} color="#923D5C" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        <Card className="mb-6 mt-4">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-text-light font-inter-medium text-sm uppercase tracking-wider mb-1">
                Test Type
              </Text>
              <Text className="text-2xl font-inter-bold text-secondary-dark">
                Full STI Panel
              </Text>
            </View>
            <Badge label="NEGATIVE" variant="success" />
          </View>

          <View className="flex-row gap-8 mb-6">
            <View>
              <Text className="text-text-light font-inter-medium text-xs mb-1">
                TEST DATE
              </Text>
              <View className="flex-row items-center">
                <Calendar size={14} color="#6B7280" />
                <Text className="text-text font-inter-semibold ml-1">
                  Dec 12, 2025
                </Text>
              </View>
            </View>
            <View>
              <Text className="text-text-light font-inter-medium text-xs mb-1">
                VERIFIED
              </Text>
              <View className="flex-row items-center">
                <ShieldCheck size={14} color="#28A745" />
                <Text className="text-success font-inter-semibold ml-1">
                  Yes
                </Text>
              </View>
            </View>
          </View>

          <Pressable className="bg-gray-50 rounded-2xl p-4 flex-row items-center justify-between active:bg-gray-100">
            <View className="flex-row items-center">
              <Download size={18} color="#923D5C" />
              <Text className="text-primary font-inter-medium ml-2">
                Original Document.pdf
              </Text>
            </View>
            <ChevronLeft
              size={16}
              color="#E0E0E0"
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </Pressable>
        </Card>

        <Text className="text-lg font-inter-bold text-secondary-dark mb-4">
          Detailed Breakdown
        </Text>

        <View className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
          <STILineItem name="HIV-1/2" result="Non-reactive" status="success" />
          <View className="h-[1px] bg-border mx-4" />
          <STILineItem name="Syphilis" result="Non-reactive" status="success" />
          <View className="h-[1px] bg-border mx-4" />
          <STILineItem
            name="Chlamydia"
            result="Not detected"
            status="success"
          />
          <View className="h-[1px] bg-border mx-4" />
          <STILineItem
            name="Gonorrhea"
            result="Not detected"
            status="success"
          />
          <View className="h-[1px] bg-border mx-4" />
          <STILineItem name="Hepatitis B" result="Immune" status="success" />
        </View>

        <View className="bg-warning-light/30 p-5 rounded-3xl flex-row items-start mb-12">
          <AlertCircle size={20} color="#FFC107" />
          <Text className="ml-3 flex-1 text-text text-sm leading-5 font-inter-regular">
            This result is for information purposes only. Always consult with a
            healthcare professional for medical advice.
          </Text>
        </View>
      </ScrollView>

      <View className="p-6 bg-white border-t border-border">
        <Button label="Share This Result" />
      </View>
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
  status: "success" | "danger" | "warning";
}) {
  const textColor =
    status === "success"
      ? "text-success"
      : status === "danger"
      ? "text-danger"
      : "text-warning";

  return (
    <View className="flex-row items-center justify-between p-4">
      <Text className="text-text font-inter-medium">{name}</Text>
      <Text className={`${textColor} font-inter-semibold`}>{result}</Text>
    </View>
  );
}
