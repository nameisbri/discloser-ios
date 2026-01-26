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
import { useTestResults, useReminders, useProfile } from "../../lib/hooks";
import { useTheme } from "../../context/theme";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import type { TestStatus, STIResult, RiskLevel } from "../../lib/types";
import { parseDocument, DocumentParsingError } from "../../lib/parsing";
import { isStatusSTI } from "../../lib/parsing/testNormalizer";
import { ROUTINE_TESTS } from "../../lib/constants";
import { isRetryableError } from "../../lib/http/errors";

// Risk level to testing interval in days
const RISK_INTERVALS: Record<RiskLevel, number> = {
  low: 365,      // 12 months
  moderate: 180, // 6 months
  high: 90,      // 3 months
};

const RISK_FREQUENCY: Record<RiskLevel, "monthly" | "quarterly" | "biannual" | "annual"> = {
  low: "annual",
  moderate: "biannual",
  high: "quarterly",
};

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
  "Herpes (HSV-1)",
  "Herpes (HSV-2)",
  "Trichomoniasis",
];

// Test presets for quick selection
const TEST_PRESETS = [
  {
    id: "full",
    label: "Full Panel",
    description: "All 9 common STIs",
    tests: ["HIV-1/2", "Syphilis", "Chlamydia", "Gonorrhea", "Hepatitis B", "Hepatitis C", "Herpes (HSV-1)", "Herpes (HSV-2)", "Trichomoniasis"],
  },
  {
    id: "basic",
    label: "Basic Screen",
    description: "Syphilis, Gonorrhea & Chlamydia",
    tests: ["Syphilis", "Chlamydia", "Gonorrhea"],
  },
  {
    id: "std4",
    label: "4-Test Panel",
    description: "HIV, Syphilis, Chlamydia, Gonorrhea",
    tests: ["HIV-1/2", "Syphilis", "Chlamydia", "Gonorrhea"],
  },
  {
    id: "hiv",
    label: "HIV Only",
    description: "HIV-1/2 test",
    tests: ["HIV-1/2"],
  },
  {
    id: "custom",
    label: "Custom",
    description: "Select specific tests",
    tests: [],
  },
];

export default function Upload() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { results, createResult } = useTestResults();
  const { activeReminders, createReminder, updateReminder } = useReminders();
  const { profile, addKnownCondition, hasKnownCondition } = useProfile();

  const [step, setStep] = useState<Step>("select");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsingErrors, setParsingErrors] = useState<Array<{
    fileIndex: number;
    fileName: string;
    error: DocumentParsingError;
  }>>([]);

  // Form state
  const [testDate, setTestDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [testType, setTestType] = useState("Full STI Panel");
  const [overallStatus, setOverallStatus] = useState<TestStatus>("negative");
  const [extractedResults, setExtractedResults] = useState<STIResult[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>(DEFAULT_STI_TESTS);
  const [selectedPreset, setSelectedPreset] = useState<string>("full");
  const [notes, setNotes] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<{
    labName?: string;
    patientName?: string;
    hasHealthCard: boolean;
    hasAccessionNumber: boolean;
    nameMatched: boolean;
  } | null>(null);

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
      Alert.alert("Couldn't Open Photos", "We couldn't access your photos. Please try again or check your permissions in Settings.");
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
      setParsingErrors([]); // Reset errors on new parse attempt

      // Parse all files in parallel with proper error tracking
      const parsePromises = selectedFiles.map((file, index) =>
        parseDocument(
          file.uri,
          "image/jpeg",
          profile ? { first_name: profile.first_name, last_name: profile.last_name } : undefined,
          `File ${index + 1} of ${selectedFiles.length}`
        ).catch((error) => ({
          // Handle individual file failures gracefully
          collectionDate: null,
          testType: null,
          tests: [],
          notes: undefined,
          isVerified: false,
          verificationDetails: undefined,
          error: error,
          fileIndex: index,
        }))
      );

      const parsedDocuments = await Promise.all(parsePromises);

      // Aggregate results from all parsed documents
      let allResults: STIResult[] = [];
      let collectionDate: string | null = null;
      let testType: string | null = null;
      let extractedNotes: string[] = [];
      let verified = false;
      let vDetails: {
        labName?: string;
        patientName?: string;
        hasHealthCard: boolean;
        hasAccessionNumber: boolean;
        nameMatched: boolean;
      } | null = null;
      const errors: Array<{ fileIndex: number; fileName: string; error: DocumentParsingError }> = [];

      // Track error types for better messaging
      const errorTypes = {
        network: 0,
        ocr: 0,
        llm_parsing: 0,
        other: 0,
      };

      parsedDocuments.forEach((parsed, index) => {
        if ('error' in parsed && parsed.error) {
          // Track DocumentParsingError instances
          if (parsed.error instanceof DocumentParsingError) {
            errors.push({
              fileIndex: index,
              fileName: selectedFiles[index].name,
              error: parsed.error,
            });

            // Count error types
            if (parsed.error.step === 'network') errorTypes.network++;
            else if (parsed.error.step === 'ocr') errorTypes.ocr++;
            else if (parsed.error.step === 'llm_parsing') errorTypes.llm_parsing++;
            else errorTypes.other++;
          } else {
            // Handle generic errors
            errors.push({
              fileIndex: index,
              fileName: selectedFiles[index].name,
              error: new DocumentParsingError(
                'unknown',
                parsed.error instanceof Error ? parsed.error.message : 'Unknown error',
                { fileIdentifier: `File ${index + 1} of ${selectedFiles.length}` }
              ),
            });
            errorTypes.other++;
          }
          return;
        }

        if (!collectionDate && parsed.collectionDate) collectionDate = parsed.collectionDate;
        if (!testType && parsed.testType) testType = parsed.testType;
        if (parsed.notes) extractedNotes.push(parsed.notes);
        if (parsed.isVerified) verified = true;
        if (parsed.verificationDetails && !vDetails) vDetails = parsed.verificationDetails;

        if (parsed.tests.length > 0) {
          const results: STIResult[] = parsed.tests.map((t) => ({
            name: t.name,
            result: t.result,
            status: t.status,
          }));
          allResults = [...allResults, ...results];
        }
      });

      setIsVerified(verified);
      setVerificationDetails(vDetails);
      setParsingErrors(errors);

      if (collectionDate) setTestDate(collectionDate);
      if (testType) setTestType(testType);
      if (allResults.length > 0) {
        setExtractedResults(allResults);
        const allNegative = allResults.every((t) => t.status === "negative");
        const anyPositive = allResults.some((t) => t.status === "positive");
        setOverallStatus(anyPositive ? "positive" : allNegative ? "negative" : "pending");
        setNotes(extractedNotes.length > 0 ? extractedNotes.join("\n\n") : "");
      }

      // Build success/failure message based on results
      const successCount = selectedFiles.length - errors.length;

      if (errors.length === 0) {
        // All files processed successfully
        Alert.alert(
          "Success",
          `Processed ${selectedFiles.length} image(s), found ${allResults.length} test(s). Review below.`,
          [{ text: "OK" }]
        );
      } else if (successCount > 0) {
        // Partial success
        const errorSummary = buildErrorSummary(errorTypes);
        Alert.alert(
          "Partial Success",
          `Processed ${successCount}/${selectedFiles.length} image(s), found ${allResults.length} test(s).\n\n${errorSummary}`,
          [{ text: "OK" }]
        );
      } else {
        // All files failed
        const errorSummary = buildErrorSummary(errorTypes);
        Alert.alert(
          "Processing Failed",
          `Failed to process ${errors.length} image(s).\n\n${errorSummary}`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Auto-extraction Failed",
        error instanceof Error ? error.message : "Please enter manually.",
        [{ text: "OK" }]
      );
    } finally {
      setParsing(false);
    }
  };

  /**
   * Builds a user-friendly error summary based on error types
   */
  const buildErrorSummary = (errorTypes: Record<string, number>): string => {
    const messages: string[] = [];

    if (errorTypes.network > 0) {
      messages.push(`${errorTypes.network} network error(s) - check your connection`);
    }
    if (errorTypes.ocr > 0) {
      messages.push(`${errorTypes.ocr} image(s) could not be read - ensure clarity`);
    }
    if (errorTypes.llm_parsing > 0) {
      messages.push(`${errorTypes.llm_parsing} document(s) could not be parsed`);
    }
    if (errorTypes.other > 0) {
      messages.push(`${errorTypes.other} other error(s)`);
    }

    return messages.join('\n');
  };

  /**
   * Retries parsing for failed files
   */
  const retryFailedFiles = async () => {
    const failedIndices = parsingErrors.map((e) => e.fileIndex);
    const filesToRetry = selectedFiles.filter((_, index) => failedIndices.includes(index));

    if (filesToRetry.length === 0) return;

    try {
      setParsing(true);

      // Retry parsing only failed files
      const retryPromises = filesToRetry.map((file, arrayIndex) => {
        const originalIndex = failedIndices[arrayIndex];
        return parseDocument(
          file.uri,
          "image/jpeg",
          profile ? { first_name: profile.first_name, last_name: profile.last_name } : undefined,
          `File ${originalIndex + 1} of ${selectedFiles.length}`
        ).catch((error) => ({
          collectionDate: null,
          testType: null,
          tests: [],
          notes: undefined,
          isVerified: false,
          verificationDetails: undefined,
          error: error,
          fileIndex: originalIndex,
        }));
      });

      const retryResults = await Promise.all(retryPromises);

      // Process retry results and update state
      let newResults: STIResult[] = [...extractedResults];
      let collectionDate: string | null = testDate;
      let testTypeValue: string | null = testType;
      let extractedNotesArr: string[] = notes ? [notes] : [];
      let verified = isVerified;
      let vDetails: {
        labName?: string;
        patientName?: string;
        hasHealthCard: boolean;
        hasAccessionNumber: boolean;
        nameMatched: boolean;
      } | null = verificationDetails;
      const remainingErrors: Array<{ fileIndex: number; fileName: string; error: DocumentParsingError }> = [];

      retryResults.forEach((parsed, arrayIndex) => {
        const originalIndex = failedIndices[arrayIndex];

        if ('error' in parsed && parsed.error) {
          // Still failed, keep error
          if (parsed.error instanceof DocumentParsingError) {
            remainingErrors.push({
              fileIndex: originalIndex,
              fileName: selectedFiles[originalIndex].name,
              error: parsed.error,
            });
          }
          return;
        }

        // Success! Add to results
        if (!collectionDate && parsed.collectionDate) collectionDate = parsed.collectionDate;
        if (!testTypeValue && parsed.testType) testTypeValue = parsed.testType;
        if (parsed.notes) extractedNotesArr.push(parsed.notes);
        if (parsed.isVerified) verified = true;
        if (parsed.verificationDetails && !vDetails) vDetails = parsed.verificationDetails;

        if (parsed.tests.length > 0) {
          const results: STIResult[] = parsed.tests.map((t) => ({
            name: t.name,
            result: t.result,
            status: t.status,
          }));
          newResults = [...newResults, ...results];
        }
      });

      // Update state with retry results
      setExtractedResults(newResults);
      if (collectionDate) setTestDate(collectionDate);
      if (testTypeValue) setTestType(testTypeValue);
      if (newResults.length > 0) {
        const allNegative = newResults.every((t) => t.status === "negative");
        const anyPositive = newResults.some((t) => t.status === "positive");
        setOverallStatus(anyPositive ? "positive" : allNegative ? "negative" : "pending");
      }
      setNotes(extractedNotesArr.join("\n\n"));
      setIsVerified(verified);
      setVerificationDetails(vDetails);
      setParsingErrors(remainingErrors);

      const successCount = filesToRetry.length - remainingErrors.length;
      if (remainingErrors.length === 0) {
        Alert.alert(
          "Success",
          `Successfully processed all ${successCount} file(s) on retry!`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Partial Success",
          `Processed ${successCount}/${filesToRetry.length} file(s) on retry. ${remainingErrors.length} still failed.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Retry Failed",
        error instanceof Error ? error.message : "Please try again or enter manually.",
        [{ text: "OK" }]
      );
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    // Check for duplicate test date
    const existingResult = results.find((r) => r.test_date === testDate);
    if (existingResult) {
      Alert.alert(
        "Duplicate Test Date",
        `You already have results from ${testDate}. Do you want to add another result for this date?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => router.replace("/dashboard") },
          { text: "Add Anyway", onPress: () => submitResult() },
        ]
      );
      return;
    }
    await submitResult();
  };

  const submitResult = async () => {
    try {
      setUploading(true);

      // NOTE: For privacy, we do NOT store medical document files in cloud storage.
      // Images are only used locally for OCR text extraction during upload.
      // Only structured test data (dates, results) is saved to the database.

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
        notes: notes || undefined,
        is_verified: isVerified,
      });

      if (result) {
        // Auto-add positive status STIs to known conditions
        const newStatusPositives = stiResults.filter(
          (sti) => sti.status === "positive" && isStatusSTI(sti.name) && !hasKnownCondition(sti.name)
        );
        for (const sti of newStatusPositives) {
          await addKnownCondition(sti.name);
        }

        // Only update reminder if results contain routine tests (HIV, Syphilis, Chlamydia, Gonorrhea)
        const hasRoutine = stiResults.some((sti) =>
          ROUTINE_TESTS.some((r) => sti.name.toLowerCase().includes(r))
        );

        if (profile?.risk_level && hasRoutine) {
          const riskLevel = profile.risk_level;
          const intervalDays = RISK_INTERVALS[riskLevel];
          const nextDueDate = new Date(testDate);
          nextDueDate.setDate(nextDueDate.getDate() + intervalDays);
          const nextDateStr = nextDueDate.toISOString().split("T")[0];

          // Update first active reminder, or create new one
          const existingReminder = activeReminders[0];

          if (existingReminder) {
            await updateReminder(existingReminder.id, {
              next_date: nextDateStr,
              frequency: RISK_FREQUENCY[riskLevel],
            });
          } else {
            await createReminder({
              title: "Routine Checkup",
              frequency: RISK_FREQUENCY[riskLevel],
              next_date: nextDateStr,
              is_active: true,
            });
          }
        }

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
        Alert.alert(
          "Couldn't Save",
          "We couldn't save your test result. This might be a connection issue. Please check your internet and try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Upload Failed",
        error instanceof Error
          ? error.message
          : "We couldn't upload your test result. Please check your internet connection and try again. If this keeps happening, try entering the details manually instead."
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleTest = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
    setSelectedPreset("custom");
  };

  const selectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = TEST_PRESETS.find((p) => p.id === presetId);
    if (preset && preset.tests.length > 0) {
      setSelectedTests(preset.tests);
      setTestType(preset.label);
    }
  };

  if (step === "select") {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
        <View className="flex-row items-center px-6 py-4">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-8 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="items-center mb-10">
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/30"}`}>
              <UploadIcon size={40} color={isDark ? "#FF2D7A" : "#923D5C"} />
            </View>
            <Text className={`text-3xl font-inter-bold mb-3 ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              Add a result
            </Text>
            <Text className={`font-inter-regular text-center ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
              We'll keep it safe. You decide who sees it.
            </Text>
          </View>

          <View className="gap-4">
            <UploadOption
              icon={<Camera size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />}
              title="Take a photo"
              description="Take a photo of your results"
              onPress={() => pickImage(true)}
              isDark={isDark}
            />
            <UploadOption
              icon={<ImageIcon size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />}
              title="Choose from photos"
              description="Already have it saved? Perfect."
              onPress={() => pickImage(false)}
              isDark={isDark}
            />
            <UploadOption
              icon={<Calendar size={28} color={isDark ? "#FF2D7A" : "#923D5C"} />}
              title="Type it in"
              description="No document? No problem."
              onPress={() => setStep("details")}
              isDark={isDark}
            />
          </View>

          <View className={`p-5 rounded-3xl flex-row items-start mt-6 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/20"}`}>
            <Info size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
            <Text className={`ml-3 flex-1 font-inter-medium text-sm leading-5 ${isDark ? "text-dark-accent" : "text-primary-dark"}`}>
              Encrypted, secure, and yours alone. Privacy that's not just theatre.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === "preview") {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => {
              setSelectedFiles([]);
              setStep("select");
            }}
            className="p-2 -ml-2"
          >
            <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
          </Pressable>
          <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
            Documents Selected
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          <Text className={`font-inter-medium mb-4 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
            {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
            selected
          </Text>

          <View className="gap-3 mb-6">
            {selectedFiles.map((file, index) => (
              <Card key={index} className="flex-row items-center p-4">
                <View className={`p-3 rounded-xl mr-4 ${isDark ? "bg-dark-surface-light" : "bg-gray-50"}`}>
                  <ImageIcon size={24} color={isDark ? "#FF2D7A" : "#923D5C"} />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-inter-semibold mb-1 ${isDark ? "text-dark-text" : "text-text"}`}
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <Text className={`text-xs font-inter-regular uppercase ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                    Image
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeFile(index)}
                  className={`p-2 rounded-xl ${isDark ? "bg-dark-danger-bg" : "bg-danger-light"}`}
                >
                  <X size={18} color="#DC3545" />
                </Pressable>
              </Card>
            ))}
          </View>

          {/* Add more files */}
          <Pressable
            onPress={() => setStep("select")}
            className={`flex-row items-center justify-center py-4 border-2 border-dashed rounded-2xl mb-6 ${isDark ? "border-dark-border" : "border-border"}`}
          >
            <Plus size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
            <Text className={`font-inter-semibold ml-2 ${isDark ? "text-dark-accent" : "text-primary"}`}>
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
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
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
            <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
          </Pressable>
          <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
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
            <View className={`p-4 rounded-2xl flex-row items-center mb-3 ${isDark ? "bg-dark-success-bg" : "bg-success-light/50"}`}>
              <Check size={20} color={isDark ? "#00E5A0" : "#28A745"} />
              <Text className={`font-inter-medium ml-2 flex-1 ${isDark ? "text-dark-mint" : "text-success"}`}>
                {selectedFiles.length} file
                {selectedFiles.length !== 1 ? "s" : ""} attached
              </Text>
            </View>
          )}

          {/* Show verification status with detailed feedback */}
          {verificationDetails && (
            <View className={`p-4 rounded-2xl mb-3 ${isVerified ? (isDark ? "bg-dark-accent-muted" : "bg-primary-light/50") : (isDark ? "bg-dark-warning-bg" : "bg-warning-light/50")}`}>
              <View className="flex-row items-center mb-2">
                {isVerified ? (
                  <Check size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
                ) : (
                  <Info size={20} color={isDark ? "#FFD700" : "#FFA500"} />
                )}
                <Text className={`font-inter-semibold ml-2 ${isVerified ? (isDark ? "text-dark-accent" : "text-primary") : (isDark ? "text-dark-warning" : "text-warning-dark")}`}>
                  {isVerified ? "Document verified" : "Document not verified"}
                </Text>
              </View>

              {/* Lab name */}
              {verificationDetails.labName && (
                <View className="flex-row items-center ml-7 mb-1">
                  <Check size={14} color={isDark ? "#00E5A0" : "#28A745"} />
                  <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-mint" : "text-success"}`}>
                    From: {verificationDetails.labName}
                  </Text>
                </View>
              )}

              {/* Identifiers */}
              {(verificationDetails.hasHealthCard || verificationDetails.hasAccessionNumber) ? (
                <View className="flex-row items-center ml-7 mb-1">
                  <Check size={14} color={isDark ? "#00E5A0" : "#28A745"} />
                  <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-mint" : "text-success"}`}>
                    {verificationDetails.hasHealthCard && verificationDetails.hasAccessionNumber
                      ? "Health card & accession number present"
                      : verificationDetails.hasHealthCard
                      ? "Health card present"
                      : "Accession number present"}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center ml-7 mb-1">
                  <X size={14} color={isDark ? "#FF6B6B" : "#DC3545"} />
                  <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-danger" : "text-danger"}`}>
                    Missing health card or accession number
                  </Text>
                </View>
              )}

              {/* Name match */}
              {verificationDetails.patientName && profile && (
                verificationDetails.nameMatched ? (
                  <View className="flex-row items-center ml-7 mb-1">
                    <Check size={14} color={isDark ? "#00E5A0" : "#28A745"} />
                    <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-mint" : "text-success"}`}>
                      Name matches your profile
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center ml-7 mb-1">
                    <X size={14} color={isDark ? "#FF6B6B" : "#DC3545"} />
                    <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-danger" : "text-danger"}`}>
                      Name doesn't match your profile ({verificationDetails.patientName})
                    </Text>
                  </View>
                )
              )}

              {!isVerified && (
                <Text className={`text-xs font-inter-regular ml-7 mt-2 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                  You can still save this result, but it won't be marked as verified.
                </Text>
              )}
            </View>
          )}

          {/* Parsing Errors Display */}
          {!parsing && parsingErrors.length > 0 && (
            <View className="mb-6">
              <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
                Processing Errors ({parsingErrors.length})
              </Text>

              {parsingErrors.map((errorInfo, idx) => {
                const isRetryable = errorInfo.error.step === 'network' || errorInfo.error.step === 'ocr' || isRetryableError(errorInfo.error.originalError);

                return (
                  <View
                    key={idx}
                    className={`border rounded-2xl p-4 mb-3 ${isDark ? "bg-dark-danger-bg border-dark-border" : "bg-danger-light border-danger"}`}
                  >
                    <View className="flex-row items-start mb-2">
                      <X size={18} color="#DC3545" className="mr-2 mt-1" />
                      <View className="flex-1">
                        <Text className={`font-inter-semibold mb-1 ${isDark ? "text-dark-danger" : "text-danger"}`}>
                          {errorInfo.fileName}
                        </Text>
                        <Text className={`font-inter-regular text-sm ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                          {errorInfo.error.getUserMessage()}
                        </Text>

                        {/* Show error type badge */}
                        <View className="mt-2">
                          <Text className={`text-xs font-inter-medium ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                            Error type: {errorInfo.error.step}
                          </Text>
                        </View>

                        {/* Retryable indicator */}
                        {isRetryable && (
                          <View className={`mt-2 px-2 py-1 rounded-full self-start ${isDark ? "bg-dark-warning-bg" : "bg-warning-light"}`}>
                            <Text className={`text-xs font-inter-medium ${isDark ? "text-dark-warning" : "text-warning-dark"}`}>
                              Can retry
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Retry Button - show if any errors are retryable */}
              {parsingErrors.some((e) => e.error.step === 'network' || e.error.step === 'ocr' || isRetryableError(e.error.originalError)) && (
                <Button
                  label="Retry Auto-Extract"
                  onPress={retryFailedFiles}
                  variant="secondary"
                  className="mt-2"
                />
              )}
            </View>
          )}

          {parsing && (
            <View className={`p-6 rounded-3xl items-center mb-6 ${isDark ? "bg-dark-surface" : "bg-primary-light/20"}`}>
              <ActivityIndicator size="large" color={isDark ? "#FF2D7A" : "#923D5C"} />
              <Text className={`mt-4 text-xl font-inter-bold text-center ${isDark ? "text-dark-text" : "text-primary-dark"}`}>
                Processing your results...
              </Text>
              <Text className={`mt-2 text-sm font-inter-regular text-center ${isDark ? "text-dark-accent" : "text-primary"}`}>
                Reading {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''}
              </Text>
              <Text className={`mt-3 text-xs font-inter-regular text-center ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                Hang tight, 15-30 seconds
              </Text>
            </View>
          )}

          {!parsing && (
            <>
              {/* Test Date */}
              <View className="mb-6">
                <Text className={`font-inter-semibold mb-2 ${isDark ? "text-dark-text" : "text-text"}`}>
                  Test Date
                </Text>
                <TextInput
                  value={testDate}
                  onChangeText={setTestDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                  className={`border rounded-2xl px-4 py-4 font-inter-regular ${
                    isDark
                      ? "bg-dark-surface border-dark-border text-dark-text"
                      : "bg-white border-border text-text"
                  }`}
                />
              </View>

              {/* Test Type */}
              <View className="mb-6">
                <Text className={`font-inter-semibold mb-2 ${isDark ? "text-dark-text" : "text-text"}`}>
                  Test Type
                </Text>
                <TextInput
                  value={testType}
                  onChangeText={setTestType}
                  placeholder="e.g., Full STI Panel"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                  className={`border rounded-2xl px-4 py-4 font-inter-regular ${
                    isDark
                      ? "bg-dark-surface border-dark-border text-dark-text"
                      : "bg-white border-border text-text"
                  }`}
                />
              </View>

              {/* Overall Status - only show for manual entry */}
              {extractedResults.length === 0 && (
                <View className="mb-6">
                  <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
                    Overall Result
                  </Text>
                  <View className="flex-row gap-3">
                    <StatusButton
                      label="Negative"
                      selected={overallStatus === "negative"}
                      onPress={() => setOverallStatus("negative")}
                      variant="success"
                      isDark={isDark}
                    />
                    <StatusButton
                      label="Positive"
                      selected={overallStatus === "positive"}
                      onPress={() => setOverallStatus("positive")}
                      variant="danger"
                      isDark={isDark}
                    />
                    <StatusButton
                      label="Pending"
                      selected={overallStatus === "pending"}
                      onPress={() => setOverallStatus("pending")}
                      variant="warning"
                      isDark={isDark}
                    />
                  </View>
                </View>
              )}
            </>
          )}

          {/* Tests Included */}
          {parsing ? null : extractedResults.length > 0 ? (
            <View className="mb-6">
              <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
                Extracted Test Results ({extractedResults.length})
              </Text>
              {extractedResults.map((sti, index) => (
                <View key={index} className={`border rounded-2xl p-4 mb-3 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
                  <Text className={`font-inter-semibold mb-1 ${isDark ? "text-dark-text" : "text-text"}`}>{sti.name}</Text>
                  <Text className={`font-inter-regular text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>{sti.result}</Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        const updated = [...extractedResults];
                        updated[index].status = "negative";
                        setExtractedResults(updated);
                      }}
                      className={`px-3 py-1 rounded-full ${
                        sti.status === "negative"
                          ? "bg-success"
                          : isDark ? "bg-dark-surface-light" : "bg-gray-100"
                      }`}
                    >
                      <Text className={sti.status === "negative" ? "text-white text-xs" : isDark ? "text-dark-text-secondary text-xs" : "text-gray-600 text-xs"}>
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
                        sti.status === "positive"
                          ? "bg-danger"
                          : isDark ? "bg-dark-surface-light" : "bg-gray-100"
                      }`}
                    >
                      <Text className={sti.status === "positive" ? "text-white text-xs" : isDark ? "text-dark-text-secondary text-xs" : "text-gray-600 text-xs"}>
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
                        sti.status === "pending"
                          ? "bg-warning"
                          : isDark ? "bg-dark-surface-light" : "bg-gray-100"
                      }`}
                    >
                      <Text className={sti.status === "pending" ? "text-white text-xs" : isDark ? "text-dark-text-secondary text-xs" : "text-gray-600 text-xs"}>
                        Pending
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="mb-6">
              {/* Test Presets */}
              <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
                What tests did you get?
              </Text>
              <View className="gap-2 mb-4">
                {TEST_PRESETS.slice(0, 4).map((preset) => (
                  <Pressable
                    key={preset.id}
                    onPress={() => selectPreset(preset.id)}
                    className={`p-4 rounded-2xl border-2 flex-row items-center justify-between ${
                      selectedPreset === preset.id
                        ? isDark
                          ? "bg-dark-accent-muted border-dark-accent"
                          : "bg-primary-light/30 border-primary"
                        : isDark
                        ? "bg-dark-surface border-dark-border"
                        : "bg-white border-border"
                    }`}
                  >
                    <View>
                      <Text
                        className={`font-inter-semibold ${
                          selectedPreset === preset.id
                            ? isDark ? "text-dark-accent" : "text-primary"
                            : isDark ? "text-dark-text" : "text-text"
                        }`}
                      >
                        {preset.label}
                      </Text>
                      <Text className={`text-xs font-inter-regular mt-0.5 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                        {preset.description}
                      </Text>
                    </View>
                    {selectedPreset === preset.id && (
                      <View className={`w-6 h-6 rounded-full items-center justify-center ${isDark ? "bg-dark-accent" : "bg-primary"}`}>
                        <Check size={14} color="white" strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Custom Test Selection */}
              <Pressable
                onPress={() => setSelectedPreset("custom")}
                className="mb-3"
              >
                <Text className={`font-inter-medium text-sm ${selectedPreset === "custom" ? isDark ? "text-dark-accent" : "text-primary" : isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                  {selectedPreset === "custom" ? "Custom selection:" : "Or select specific tests →"}
                </Text>
              </Pressable>

              {selectedPreset === "custom" && (
                <View className="flex-row flex-wrap gap-2">
                  {DEFAULT_STI_TESTS.map((test) => (
                    <Pressable
                      key={test}
                      onPress={() => toggleTest(test)}
                      className={`px-4 py-2 rounded-full border ${
                        selectedTests.includes(test)
                          ? isDark
                            ? "bg-dark-accent border-dark-accent"
                            : "bg-primary border-primary"
                          : isDark
                          ? "bg-dark-surface border-dark-border"
                          : "bg-white border-border"
                      }`}
                    >
                      <Text
                        className={`font-inter-medium text-sm ${
                          selectedTests.includes(test)
                            ? "text-white"
                            : isDark ? "text-dark-text" : "text-text"
                        }`}
                      >
                        {test}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Summary of selected tests */}
              {selectedPreset !== "custom" && selectedTests.length > 0 && (
                <View className={`p-3 rounded-xl mt-2 ${isDark ? "bg-dark-success-bg" : "bg-success-light/30"}`}>
                  <Text className={`text-xs font-inter-medium ${isDark ? "text-dark-mint" : "text-success-dark"}`}>
                    {selectedTests.length} tests: {selectedTests.join(", ")}
                  </Text>
                </View>
              )}
            </View>
          )}

          {!parsing && (
            <>
              {/* Notes */}
              <View className="mb-8">
                <Text className={`font-inter-semibold mb-2 ${isDark ? "text-dark-text" : "text-text"}`}>
                  Notes (Optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes..."
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                  multiline
                  numberOfLines={3}
                  className={`border rounded-2xl px-4 py-4 font-inter-regular min-h-[100px] ${
                    isDark
                      ? "bg-dark-surface border-dark-border text-dark-text"
                      : "bg-white border-border text-text"
                  }`}
                  textAlignVertical="top"
                />
              </View>

              <Button
                label={uploading ? "On it..." : "Save it"}
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
  isDark,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`p-5 rounded-2xl border-2 flex-row items-center ${
        isDark
          ? "bg-dark-surface border-dark-border active:border-dark-accent active:bg-dark-surface-light"
          : "bg-background-card border-border active:border-primary active:bg-primary-muted"
      }`}
    >
      <View className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${isDark ? "bg-dark-surface-light" : "bg-primary-muted"}`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`text-base font-inter-bold mb-0.5 ${isDark ? "text-dark-text" : "text-text"}`}>
          {title}
        </Text>
        <Text className={`font-inter-regular text-sm ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
          {description}
        </Text>
      </View>
      <ChevronLeft size={20} color={isDark ? "#3D3548" : "#E5E7EB"} style={{ transform: [{ rotate: '180deg' }] }} />
    </Pressable>
  );
}

function StatusButton({
  label,
  selected,
  onPress,
  variant,
  isDark,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant: "success" | "danger" | "warning";
  isDark: boolean;
}) {
  const config = {
    success: {
      selectedBg: "bg-success",
      emoji: "✓",
      unselectedBorder: isDark ? "border-dark-success/30" : "border-success/30",
    },
    danger: {
      selectedBg: "bg-danger",
      emoji: "!",
      unselectedBorder: isDark ? "border-danger/30" : "border-danger/30",
    },
    warning: {
      selectedBg: "bg-warning",
      emoji: "?",
      unselectedBorder: isDark ? "border-dark-warning/30" : "border-warning/30",
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
      className={`flex-1 py-4 rounded-2xl border-2 ${style.unselectedBorder} ${isDark ? "bg-dark-surface" : "bg-background-card"}`}
    >
      <Text className={`text-center font-inter-medium ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
