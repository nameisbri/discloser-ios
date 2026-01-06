import { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Upload as UploadIcon,
  Camera,
  FileText,
  Info,
  ChevronLeft,
  Check,
  X,
  Calendar,
} from "lucide-react-native";
import { uploadTestDocument } from "../../lib/storage";
import { useTestResults } from "../../lib/hooks";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import type { TestStatus, STIResult } from "../../lib/types";

type Step = "select" | "preview" | "details";

const DEFAULT_STI_TESTS = [
  "HIV-1/2",
  "Syphilis",
  "Chlamydia",
  "Gonorrhea",
  "Hepatitis B",
  "Hepatitis C",
  "Herpes (HSV-2)",
];

export default function Upload() {
  const router = useRouter();
  const { createResult } = useTestResults();

  const [step, setStep] = useState<Step>("select");
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [testDate, setTestDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [testType, setTestType] = useState("Full STI Panel");
  const [overallStatus, setOverallStatus] = useState<TestStatus>("negative");
  const [selectedTests, setSelectedTests] = useState<string[]>(
    DEFAULT_STI_TESTS.slice(0, 5)
  );
  const [notes, setNotes] = useState("");

  const pickImage = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          `Please allow access to your ${useCamera ? "camera" : "photo library"} to upload test results.`
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName =
          asset.fileName || `test_result_${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`;
        setSelectedFile({ uri: asset.uri, name: fileName });
        setStep("preview");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);

      let fileUrl: string | undefined;
      let fileName: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadTestDocument(
          selectedFile.uri,
          selectedFile.name
        );
        fileUrl = uploadResult.url;
        fileName = selectedFile.name;
      }

      // Build STI results array
      const stiResults: STIResult[] = selectedTests.map((name) => ({
        name,
        result: overallStatus === "negative" ? "Non-reactive" : "Reactive",
        status: overallStatus === "pending" ? "pending" : overallStatus,
      }));

      // Create test result
      const result = await createResult({
        test_date: testDate,
        status: overallStatus,
        test_type: testType,
        sti_results: stiResults,
        file_url: fileUrl,
        file_name: fileName,
        notes: notes || undefined,
      });

      if (result) {
        Alert.alert("Success", "Test result saved successfully!", [
          { text: "View Result", onPress: () => router.replace(`/results/${result.id}`) },
          { text: "Go to Dashboard", onPress: () => router.replace("/dashboard") },
        ]);
      } else {
        Alert.alert("Error", "Failed to save test result. Please try again.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleTest = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  if (step === "select") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-6 py-4">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
        </View>

        <View className="flex-1 px-8 py-6">
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary-light/30 rounded-full items-center justify-center mb-6">
              <UploadIcon size={40} color="#923D5C" />
            </View>
            <Text className="text-3xl font-inter-bold text-secondary-dark mb-3">
              Add Test Result
            </Text>
            <Text className="text-text-light font-inter-regular text-center">
              Choose how you want to add your new test result.
            </Text>
          </View>

          <View className="gap-4">
            <UploadOption
              icon={<Camera size={28} color="#923D5C" />}
              title="Take a Photo"
              description="Use your camera to capture a result document"
              onPress={() => pickImage(true)}
            />
            <UploadOption
              icon={<FileText size={28} color="#923D5C" />}
              title="Upload from Gallery"
              description="Select an image from your photo library"
              onPress={() => pickImage(false)}
            />
            <UploadOption
              icon={<Calendar size={28} color="#923D5C" />}
              title="Manual Entry"
              description="Enter your test results manually"
              onPress={() => setStep("details")}
            />
          </View>

          <View className="mt-auto bg-primary-light/20 p-5 rounded-3xl flex-row items-start">
            <Info size={20} color="#923D5C" />
            <Text className="ml-3 flex-1 text-primary-dark font-inter-medium text-sm leading-5">
              Your documents are encrypted and stored securely. Only you control
              who can see them.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "preview") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => setStep("select")} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-lg font-inter-semibold text-secondary-dark">
            Document Selected
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 px-6 py-4">
          <Card className="mb-6">
            <View className="flex-row items-center">
              <View className="bg-success-light p-3 rounded-2xl mr-4">
                <Check size={24} color="#28A745" />
              </View>
              <View className="flex-1">
                <Text className="text-text font-inter-semibold mb-1">
                  File Ready
                </Text>
                <Text
                  className="text-text-light text-sm font-inter-regular"
                  numberOfLines={1}
                >
                  {selectedFile?.name}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedFile(null);
                  setStep("select");
                }}
                className="p-2"
              >
                <X size={20} color="#DC3545" />
              </Pressable>
            </View>
          </Card>

          <Text className="text-text-light font-inter-medium text-center mb-6">
            Now let's add the details about this test result.
          </Text>

          <Button label="Continue to Details" onPress={() => setStep("details")} />
        </View>
      </SafeAreaView>
    );
  }

  // Details step
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => setStep(selectedFile ? "preview" : "select")}
            className="p-2 -ml-2"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-lg font-inter-semibold text-secondary-dark">
            Test Details
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Test Date */}
          <View className="mb-6">
            <Text className="text-text font-inter-semibold mb-2">Test Date</Text>
            <TextInput
              value={testDate}
              onChangeText={setTestDate}
              placeholder="YYYY-MM-DD"
              className="bg-white border border-border rounded-2xl px-4 py-4 font-inter-regular text-text"
            />
          </View>

          {/* Test Type */}
          <View className="mb-6">
            <Text className="text-text font-inter-semibold mb-2">Test Type</Text>
            <TextInput
              value={testType}
              onChangeText={setTestType}
              placeholder="e.g., Full STI Panel"
              className="bg-white border border-border rounded-2xl px-4 py-4 font-inter-regular text-text"
            />
          </View>

          {/* Overall Status */}
          <View className="mb-6">
            <Text className="text-text font-inter-semibold mb-3">
              Overall Result
            </Text>
            <View className="flex-row gap-3">
              <StatusButton
                label="Negative"
                selected={overallStatus === "negative"}
                onPress={() => setOverallStatus("negative")}
                variant="success"
              />
              <StatusButton
                label="Positive"
                selected={overallStatus === "positive"}
                onPress={() => setOverallStatus("positive")}
                variant="danger"
              />
              <StatusButton
                label="Pending"
                selected={overallStatus === "pending"}
                onPress={() => setOverallStatus("pending")}
                variant="warning"
              />
            </View>
          </View>

          {/* Tests Included */}
          <View className="mb-6">
            <Text className="text-text font-inter-semibold mb-3">
              Tests Included
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DEFAULT_STI_TESTS.map((test) => (
                <Pressable
                  key={test}
                  onPress={() => toggleTest(test)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedTests.includes(test)
                      ? "bg-primary border-primary"
                      : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`font-inter-medium text-sm ${
                      selectedTests.includes(test) ? "text-white" : "text-text"
                    }`}
                  >
                    {test}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View className="mb-8">
            <Text className="text-text font-inter-semibold mb-2">
              Notes (Optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              multiline
              numberOfLines={3}
              className="bg-white border border-border rounded-2xl px-4 py-4 font-inter-regular text-text min-h-[100px]"
              textAlignVertical="top"
            />
          </View>

          <Button
            label={uploading ? "Saving..." : "Save Test Result"}
            onPress={handleSubmit}
            disabled={uploading || selectedTests.length === 0}
            className="mb-8"
            icon={
              uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : undefined
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function UploadOption({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white p-6 rounded-3xl border border-border shadow-sm flex-row items-center active:bg-gray-50"
    >
      <View className="bg-gray-50 p-4 rounded-2xl mr-5">{icon}</View>
      <View className="flex-1">
        <Text className="text-lg font-inter-semibold text-text mb-1">
          {title}
        </Text>
        <Text className="text-text-light font-inter-regular text-sm">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function StatusButton({
  label,
  selected,
  onPress,
  variant,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant: "success" | "danger" | "warning";
}) {
  const colors = {
    success: {
      bg: selected ? "bg-success" : "bg-success-light",
      text: selected ? "text-white" : "text-success",
      border: "border-success",
    },
    danger: {
      bg: selected ? "bg-danger" : "bg-danger-light",
      text: selected ? "text-white" : "text-danger",
      border: "border-danger",
    },
    warning: {
      bg: selected ? "bg-warning" : "bg-warning-light",
      text: selected ? "text-white" : "text-warning",
      border: "border-warning",
    },
  };

  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-3 rounded-2xl border ${colors[variant].bg} ${
        selected ? colors[variant].border : "border-transparent"
      }`}
    >
      <Text
        className={`text-center font-inter-semibold ${colors[variant].text}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
