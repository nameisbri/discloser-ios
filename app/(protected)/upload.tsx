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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Upload as UploadIcon,
  Camera,
  Info,
  ChevronLeft,
  Check,
  X,
  Calendar,
  Plus,
  Image as ImageIcon,
} from "lucide-react-native";
import { uploadTestDocument } from "../../lib/storage";
import { useTestResults } from "../../lib/hooks";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import type { TestStatus, STIResult } from "../../lib/types";
import { parseDocument } from "../../lib/parsing";

type Step = "select" | "preview" | "details";

type SelectedFile = {
  uri: string;
  name: string;
  type: "image";
};

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
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);

  // Form state
  const [testDate, setTestDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [testType, setTestType] = useState("Full STI Panel");
  const [overallStatus, setOverallStatus] = useState<TestStatus>("negative");
  const [extractedResults, setExtractedResults] = useState<STIResult[]>([]);
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
            allowsEditing: false,
            quality: 0.8,
            allowsMultipleSelection: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
            allowsMultipleSelection: true,
          });

      if (!result.canceled && result.assets.length > 0) {
        const newFiles: SelectedFile[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name:
            asset.fileName ||
            `test_result_${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`,
          type: "image" as const,
        }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setStep("preview");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };


  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
      setStep("select");
    }
  };

  const parseFirstDocument = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setParsing(true);
      let allResults: STIResult[] = [];
      let collectionDate: string | null = null;
      let testType: string | null = null;

      // Parse all selected files
      for (const file of selectedFiles) {
        const parsed = await parseDocument(file.uri, "image/jpeg");

        if (!collectionDate && parsed.collectionDate) collectionDate = parsed.collectionDate;
        if (!testType && parsed.testType) testType = parsed.testType;

        if (parsed.tests.length > 0) {
          const results: STIResult[] = parsed.tests.map((t) => ({
            name: t.name,
            result: t.result,
            status: t.status,
          }));
          allResults = [...allResults, ...results];
        }
      }

      if (collectionDate) setTestDate(collectionDate);
      if (testType) setTestType(testType);
      if (allResults.length > 0) {
        setExtractedResults(allResults);
        const allNegative = allResults.every((t) => t.status === "negative");
        const anyPositive = allResults.some((t) => t.status === "positive");
        setOverallStatus(anyPositive ? "positive" : allNegative ? "negative" : "pending");
        setNotes(`Auto-extracted from ${selectedFiles.length} image(s): ${allResults.length} test(s). Please review.`);
      }

      Alert.alert("Success", `Processed ${selectedFiles.length} image(s), found ${allResults.length} test(s). Review below.`, [{ text: "OK" }]);
    } catch (error) {
      Alert.alert("Auto-extraction Failed", error instanceof Error ? error.message : "Please enter manually.", [{ text: "OK" }]);
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);

      let fileUrl: string | undefined;
      let fileName: string | undefined;

      // Upload first file (for now, we store the first file URL)
      // TODO: Support multiple file URLs in the future
      if (selectedFiles.length > 0) {
        const firstFile = selectedFiles[0];
        const uploadResult = await uploadTestDocument(
          firstFile.uri,
          firstFile.name
        );
        fileUrl = uploadResult.url;
        fileName = firstFile.name;

        // Upload additional files (they're stored but not linked to result yet)
        for (let i = 1; i < selectedFiles.length; i++) {
          await uploadTestDocument(selectedFiles[i].uri, selectedFiles[i].name);
        }
      }

      // Build STI results array - use extracted results if available, otherwise create from selected tests
      const stiResults: STIResult[] = extractedResults.length > 0
        ? extractedResults
        : selectedTests.map((name) => ({
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
          {
            text: "View Result",
            onPress: () => router.replace(`/results/${result.id}`),
          },
          {
            text: "Go to Dashboard",
            onPress: () => router.replace("/dashboard"),
          },
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

        <ScrollView className="flex-1 px-8 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="items-center mb-10">
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
              icon={<ImageIcon size={28} color="#923D5C" />}
              title="Choose from Gallery"
              description="Select images from your photo library"
              onPress={() => pickImage(false)}
            />
            <UploadOption
              icon={<Calendar size={28} color="#923D5C" />}
              title="Manual Entry"
              description="Enter your test results manually"
              onPress={() => setStep("details")}
            />
          </View>

          <View className="bg-primary-light/20 p-5 rounded-3xl flex-row items-start mt-6">
            <Info size={20} color="#923D5C" />
            <Text className="ml-3 flex-1 text-primary-dark font-inter-medium text-sm leading-5">
              Your documents are encrypted and stored securely. Only you control
              who can see them.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === "preview") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => {
              setSelectedFiles([]);
              setStep("select");
            }}
            className="p-2 -ml-2"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-lg font-inter-semibold text-secondary-dark">
            Documents Selected
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <Text className="text-text-light font-inter-medium mb-4">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
            selected
          </Text>

          <View className="gap-3 mb-6">
            {selectedFiles.map((file, index) => (
              <Card key={index} className="flex-row items-center p-4">
                <View className="bg-gray-50 p-3 rounded-xl mr-4">
                  <ImageIcon size={24} color="#923D5C" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-text font-inter-semibold mb-1"
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <Text className="text-text-light text-xs font-inter-regular uppercase">
                    Image
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeFile(index)}
                  className="p-2 bg-danger-light rounded-xl"
                >
                  <X size={18} color="#DC3545" />
                </Pressable>
              </Card>
            ))}
          </View>

          {/* Add more files */}
          <Pressable
            onPress={() => setStep("select")}
            className="flex-row items-center justify-center py-4 border-2 border-dashed border-border rounded-2xl mb-6"
          >
            <Plus size={20} color="#923D5C" />
            <Text className="text-primary font-inter-semibold ml-2">
              Add More Files
            </Text>
          </Pressable>

          <Button
            label="Continue to Details"
            onPress={async () => {
              setStep("details");
              await parseFirstDocument();
            }}
          />
        </ScrollView>
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
            onPress={() =>
              setStep(selectedFiles.length > 0 ? "preview" : "select")
            }
            className="p-2 -ml-2"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-lg font-inter-semibold text-secondary-dark">
            Test Details
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Show attached files summary */}
          {selectedFiles.length > 0 && (
            <>
              <Pressable
                onPress={() => setStep("preview")}
                className="bg-success-light/50 p-4 rounded-2xl flex-row items-center mb-3"
              >
                <Check size={20} color="#28A745" />
                <Text className="text-success font-inter-medium ml-2 flex-1">
                  {selectedFiles.length} file
                  {selectedFiles.length !== 1 ? "s" : ""} attached
                </Text>
                <Text className="text-success/70 text-sm font-inter-regular">
                  Tap to edit
                </Text>
              </Pressable>
            </>
          )}

          {parsing && (
            <View className="bg-primary-light/20 p-6 rounded-3xl items-center mb-6">
              <ActivityIndicator size="large" color="#923D5C" />
              <Text className="mt-4 text-xl font-inter-bold text-primary-dark text-center">
                Reading your test results...
              </Text>
              <Text className="mt-2 text-sm font-inter-regular text-primary text-center">
                Analyzing {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''} with AI
              </Text>
              <Text className="mt-3 text-xs font-inter-regular text-text-light text-center">
                This may take 15-30 seconds
              </Text>
            </View>
          )}

          {!parsing && (
            <>
              {/* Test Date */}
              <View className="mb-6">
                <Text className="text-text font-inter-semibold mb-2">
                  Test Date
                </Text>
                <TextInput
                  value={testDate}
                  onChangeText={setTestDate}
                  placeholder="YYYY-MM-DD"
                  className="bg-white border border-border rounded-2xl px-4 py-4 font-inter-regular text-text"
                />
              </View>

              {/* Test Type */}
              <View className="mb-6">
                <Text className="text-text font-inter-semibold mb-2">
                  Test Type
                </Text>
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
            </>
          )}

          {/* Tests Included */}
          {parsing ? null : extractedResults.length > 0 ? (
            <View className="mb-6">
              <Text className="text-text font-inter-semibold mb-3">
                Extracted Test Results ({extractedResults.length})
              </Text>
              {extractedResults.map((sti, index) => (
                <View key={index} className="bg-white border border-border rounded-2xl p-4 mb-3">
                  <Text className="font-inter-semibold text-text mb-1">{sti.name}</Text>
                  <Text className="font-inter-regular text-text-light text-sm mb-2">{sti.result}</Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        const updated = [...extractedResults];
                        updated[index].status = "negative";
                        setExtractedResults(updated);
                      }}
                      className={`px-3 py-1 rounded-full ${
                        sti.status === "negative" ? "bg-success" : "bg-gray-100"
                      }`}
                    >
                      <Text className={sti.status === "negative" ? "text-white text-xs" : "text-gray-600 text-xs"}>
                        Negative
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const updated = [...extractedResults];
                        updated[index].status = "positive";
                        setExtractedResults(updated);
                      }}
                      className={`px-3 py-1 rounded-full ${
                        sti.status === "positive" ? "bg-danger" : "bg-gray-100"
                      }`}
                    >
                      <Text className={sti.status === "positive" ? "text-white text-xs" : "text-gray-600 text-xs"}>
                        Positive
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const updated = [...extractedResults];
                        updated[index].status = "pending";
                        setExtractedResults(updated);
                      }}
                      className={`px-3 py-1 rounded-full ${
                        sti.status === "pending" ? "bg-warning" : "bg-gray-100"
                      }`}
                    >
                      <Text className={sti.status === "pending" ? "text-white text-xs" : "text-gray-600 text-xs"}>
                        Pending
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
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
          )}

          {!parsing && (
            <>
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
                disabled={uploading || (extractedResults.length === 0 && selectedTests.length === 0)}
                className="mb-8"
                icon={
                  uploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : undefined
                }
              />
            </>
          )}
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
      className="bg-background-card p-5 rounded-2xl border-2 border-border flex-row items-center active:border-primary active:bg-primary-muted"
    >
      <View className="bg-primary-muted w-14 h-14 rounded-xl items-center justify-center mr-4">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-inter-bold text-text mb-0.5">
          {title}
        </Text>
        <Text className="text-text-light font-inter-regular text-sm">
          {description}
        </Text>
      </View>
      <ChevronLeft size={20} color="#E5E7EB" style={{ transform: [{ rotate: '180deg' }] }} />
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
  const config = {
    success: {
      selectedBg: "bg-success",
      emoji: "✓",
      unselectedBorder: "border-success/30",
    },
    danger: {
      selectedBg: "bg-danger",
      emoji: "!",
      unselectedBorder: "border-danger/30",
    },
    warning: {
      selectedBg: "bg-warning",
      emoji: "?",
      unselectedBorder: "border-warning/30",
    },
  };

  const style = config[variant];

  if (selected) {
    return (
      <Pressable
        onPress={onPress}
        className={`flex-1 py-4 rounded-2xl ${style.selectedBg} flex-row items-center justify-center`}
      >
        <View className="w-5 h-5 bg-white/30 rounded-full items-center justify-center mr-2">
          <Check size={12} color="white" strokeWidth={3} />
        </View>
        <Text className="text-white font-inter-bold">{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-4 rounded-2xl bg-background-card border-2 ${style.unselectedBorder}`}
    >
      <Text className="text-center font-inter-medium text-text-light">
        {label}
      </Text>
    </Pressable>
  );
}
