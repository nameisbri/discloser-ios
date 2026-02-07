import { useState, useEffect, useRef } from "react";
import { Alert, BackHandler } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useTestResults, useReminders, useProfile } from "../../../lib/hooks";
import { useTheme } from "../../../context/theme";
import { SelectStep, PreviewStep, DetailsStep, type SelectedFile } from "../../../components/upload";
import type { TestStatus, STIResult, RiskLevel } from "../../../lib/types";
import {
  parseDocument,
  DocumentParsingError,
  deduplicateTestResults,
  TestConflict,
  validatePDF,
  isPDFExtractionAvailable,
  determineTestType,
} from "../../../lib/parsing";
import { isStatusSTI } from "../../../lib/parsing/testNormalizer";
import { ROUTINE_TESTS } from "../../../lib/constants";
import { parseDateOnly, toDateString } from "../../../lib/utils/date";

// Maximum number of files that can be uploaded at once
const MAX_FILES_LIMIT = 4;

// Risk level to testing interval in days
const RISK_INTERVALS: Record<RiskLevel, number> = {
  low: 365,
  moderate: 180,
  high: 90,
};

const RISK_FREQUENCY: Record<RiskLevel, "monthly" | "quarterly" | "biannual" | "annual"> = {
  low: "annual",
  moderate: "biannual",
  high: "quarterly",
};

type Step = "select" | "preview" | "details";

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
  const [parsingProgress, setParsingProgress] = useState<{
    currentFile: number;
    totalFiles: number;
    step: "uploading" | "extracting" | "parsing";
  } | null>(null);
  const [parsingErrors, setParsingErrors] = useState<Array<{
    fileIndex: number;
    fileName: string;
    error: DocumentParsingError;
  }>>([]);

  // Form state
  const [testDate, setTestDate] = useState(toDateString(new Date()));
  const [testType, setTestType] = useState("Full STI Panel");
  const [overallStatus, setOverallStatus] = useState<TestStatus>("negative");
  const [extractedResults, setExtractedResults] = useState<STIResult[]>([]);
  const [notes, setNotes] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<Array<{
    labName?: string;
    patientName?: string;
    hasHealthCard: boolean;
    hasAccessionNumber: boolean;
    nameMatched: boolean;
  }>>([]);
  const [resultConflicts, setResultConflicts] = useState<TestConflict[]>([]);

  // Ref to track if parsing was cancelled
  const cancelledRef = useRef(false);

  // Prevent back navigation while parsing
  useEffect(() => {
    if (!parsing) return;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => backHandler.remove();
  }, [parsing]);

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

      const slotsAvailable = MAX_FILES_LIMIT - selectedFiles.length;

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
            selectionLimit: slotsAvailable,
          });

      if (!result.canceled && result.assets.length > 0) {
        let assetsToAdd = result.assets;

        if (selectedFiles.length + result.assets.length > MAX_FILES_LIMIT) {
          assetsToAdd = result.assets.slice(0, slotsAvailable);
          Alert.alert(
            "File Limit Reached",
            `You can upload up to ${MAX_FILES_LIMIT} images at once. ${assetsToAdd.length > 0 ? `Added ${assetsToAdd.length} image(s).` : "No images added."}`
          );
          if (assetsToAdd.length === 0) return;
        }

        const newFiles: SelectedFile[] = assetsToAdd.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `test_result_${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`,
          type: "image" as const,
        }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setStep("preview");
      }
    } catch {
      Alert.alert("Couldn't Open Photos", "We couldn't access your photos. Please try again or check your permissions in Settings.");
    }
  };

  const pickPDF = async () => {
    try {
      if (!isPDFExtractionAvailable()) {
        Alert.alert(
          "PDF Not Supported",
          "PDF upload requires a development build. Please use the camera or photo library instead."
        );
        return;
      }

      const slotsAvailable = MAX_FILES_LIMIT - selectedFiles.length;
      if (slotsAvailable <= 0) {
        Alert.alert("File Limit Reached", `You can upload up to ${MAX_FILES_LIMIT} files at once.`);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        let assetsToAdd = result.assets;

        if (result.assets.length > slotsAvailable) {
          assetsToAdd = result.assets.slice(0, slotsAvailable);
          Alert.alert("File Limit Reached", `You can upload up to ${MAX_FILES_LIMIT} files at once. Added ${assetsToAdd.length} PDF(s).`);
        }

        const validatedFiles: SelectedFile[] = [];
        const validationErrors: string[] = [];

        for (const asset of assetsToAdd) {
          const validation = await validatePDF(asset.uri, asset.size);

          if (!validation.valid && !validation.pageCount) {
            validationErrors.push(`${asset.name}: ${validation.error}`);
            continue;
          }

          if (validation.error && validation.pageCount) {
            Alert.alert("Note", validation.error);
          }

          validatedFiles.push({
            uri: asset.uri,
            name: asset.name || `document_${Date.now()}.pdf`,
            type: "pdf" as const,
            size: asset.size,
            pageCount: validation.pageCount,
          });
        }

        if (validationErrors.length > 0) {
          Alert.alert("Some PDFs Could Not Be Added", validationErrors.join("\n\n"));
        }

        if (validatedFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...validatedFiles]);
          setStep("preview");
        }
      }
    } catch {
      Alert.alert("Couldn't Open Files", "We couldn't access your files. Please try again.");
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setExtractedResults([]);
    setResultConflicts([]);
    if (selectedFiles.length <= 1) {
      setStep("select");
    }
  };

  const handleCancelParsing = () => {
    cancelledRef.current = true;
    setParsing(false);
    setParsingProgress(null);
    setStep("preview");
  };

  const parseDocuments = async () => {
    if (selectedFiles.length === 0) return;

    // Reset cancellation flag
    cancelledRef.current = false;

    try {
      setParsing(true);
      setParsingErrors([]);
      setResultConflicts([]);
      setParsingProgress({
        currentFile: 0,
        totalFiles: selectedFiles.length,
        step: "uploading",
      });

      const parsedDocuments: Array<Awaited<ReturnType<typeof parseDocument>> | {
        collectionDate: null;
        testType: null;
        tests: never[];
        notes: undefined;
        isVerified: false;
        verificationDetails: undefined;
        error: unknown;
        fileIndex: number;
      }> = [];

      for (let index = 0; index < selectedFiles.length; index++) {
        // Check if cancelled before processing each file
        if (cancelledRef.current) {
          return;
        }

        // Update progress - uploading phase
        setParsingProgress({
          currentFile: index + 1,
          totalFiles: selectedFiles.length,
          step: "uploading",
        });

        const file = selectedFiles[index];
        try {
          // Update progress - extracting phase
          setParsingProgress({
            currentFile: index + 1,
            totalFiles: selectedFiles.length,
            step: "extracting",
          });

          const mimeType = file.type === "pdf" ? "application/pdf" : "image/jpeg";
          const result = await parseDocument(
            file.uri,
            mimeType,
            profile ? { first_name: profile.first_name, last_name: profile.last_name } : undefined,
            `File ${index + 1} of ${selectedFiles.length}`
          );

          // Check again after async operation
          if (cancelledRef.current) {
            return;
          }

          // Update progress - parsing phase (analyzing results)
          setParsingProgress({
            currentFile: index + 1,
            totalFiles: selectedFiles.length,
            step: "parsing",
          });

          parsedDocuments.push(result);
        } catch (error) {
          // Check if cancelled before adding error
          if (cancelledRef.current) {
            return;
          }

          parsedDocuments.push({
            collectionDate: null,
            testType: null,
            tests: [],
            notes: undefined,
            isVerified: false,
            verificationDetails: undefined,
            error,
            fileIndex: index,
          });
        }
      }

      // Final check before processing results
      if (cancelledRef.current) {
        return;
      }

      processParseResults(parsedDocuments);
    } catch (error) {
      if (!cancelledRef.current) {
        Alert.alert(
          "Auto-extraction Failed",
          error instanceof Error ? error.message : "Please enter manually.",
          [{ text: "OK" }]
        );
      }
    } finally {
      if (!cancelledRef.current) {
        setParsing(false);
        setParsingProgress(null);
      }
    }
  };

  const processParseResults = (parsedDocuments: Array<unknown>) => {
    let allResults: STIResult[] = [];
    let collectionDate: string | null = null;
    let detectedTestType: string | null = null;
    const extractedNotes: string[] = [];
    let verified = false;
    const vDetailsList: Array<{
      labName?: string;
      patientName?: string;
      hasHealthCard: boolean;
      hasAccessionNumber: boolean;
      nameMatched: boolean;
    }> = [];
    const errors: Array<{ fileIndex: number; fileName: string; error: DocumentParsingError }> = [];
    const errorTypes = { network: 0, ocr: 0, llm_parsing: 0, other: 0 };

    parsedDocuments.forEach((parsed: unknown, index: number) => {
      const doc = parsed as {
        error?: unknown;
        collectionDate?: string;
        testType?: string;
        notes?: string;
        isVerified?: boolean;
        verificationDetails?: {
          labName?: string;
          patientName?: string;
          hasHealthCard: boolean;
          hasAccessionNumber: boolean;
          nameMatched: boolean;
        };
        tests?: Array<{ name: string; result: string; status: TestStatus }>;
      };

      if (doc.error) {
        if (doc.error instanceof DocumentParsingError) {
          errors.push({ fileIndex: index, fileName: selectedFiles[index].name, error: doc.error });
          if (doc.error.step === "network") errorTypes.network++;
          else if (doc.error.step === "ocr") errorTypes.ocr++;
          else if (doc.error.step === "llm_parsing") errorTypes.llm_parsing++;
          else errorTypes.other++;
        } else {
          errors.push({
            fileIndex: index,
            fileName: selectedFiles[index].name,
            error: new DocumentParsingError(
              "unknown",
              doc.error instanceof Error ? doc.error.message : "Unknown error",
              { fileIdentifier: `File ${index + 1} of ${selectedFiles.length}` }
            ),
          });
          errorTypes.other++;
        }
        return;
      }

      if (!collectionDate && doc.collectionDate) collectionDate = doc.collectionDate;
      if (!detectedTestType && doc.testType) detectedTestType = doc.testType;
      if (doc.notes) extractedNotes.push(doc.notes);
      if (doc.isVerified) verified = true;
      if (doc.verificationDetails) {
        const labName = doc.verificationDetails.labName;
        if (!vDetailsList.some((v) => v.labName === labName)) {
          vDetailsList.push(doc.verificationDetails);
        }
      }

      if (doc.tests && doc.tests.length > 0) {
        const results: STIResult[] = doc.tests.map((t) => ({
          name: t.name,
          result: t.result,
          status: t.status,
        }));
        allResults = [...allResults, ...results];
      }
    });

    setIsVerified(verified);
    setVerificationDetails(vDetailsList);
    setParsingErrors(errors);

    if (collectionDate) setTestDate(collectionDate);

    let uniqueTestCount = 0;
    if (allResults.length > 0) {
      const deduplicationResult = deduplicateTestResults(allResults);
      setExtractedResults(deduplicationResult.tests);
      setResultConflicts(deduplicationResult.conflicts);
      uniqueTestCount = deduplicationResult.tests.length;

      const combinedTestType = determineTestType(deduplicationResult.tests);
      setTestType(combinedTestType);

      const allNegative = deduplicationResult.tests.every((t) => t.status === "negative");
      const anyPositive = deduplicationResult.tests.some((t) => t.status === "positive");
      setOverallStatus(anyPositive ? "positive" : allNegative ? "negative" : "pending");
      setNotes(extractedNotes.join("\n\n"));
    } else if (detectedTestType) {
      setTestType(detectedTestType);
    }

    // Show result alert
    const successCount = selectedFiles.length - errors.length;
    if (errors.length === 0) {
      Alert.alert("Success", `Processed ${selectedFiles.length} image(s), found ${uniqueTestCount} unique test(s). Review below.`);
    } else if (successCount > 0) {
      Alert.alert("Partial Success", `Processed ${successCount}/${selectedFiles.length} image(s), found ${uniqueTestCount} unique test(s).\n\n${buildErrorSummary(errorTypes)}`);
    } else {
      Alert.alert("Processing Failed", `Failed to process ${errors.length} image(s).\n\n${buildErrorSummary(errorTypes)}`);
    }
  };

  const buildErrorSummary = (errorTypes: Record<string, number>): string => {
    const messages: string[] = [];
    if (errorTypes.network > 0) messages.push(`${errorTypes.network} network error(s) - check your connection`);
    if (errorTypes.ocr > 0) messages.push(`${errorTypes.ocr} image(s) could not be read - ensure clarity`);
    if (errorTypes.llm_parsing > 0) messages.push(`${errorTypes.llm_parsing} document(s) could not be parsed`);
    if (errorTypes.other > 0) messages.push(`${errorTypes.other} other error(s)`);
    return messages.join("\n");
  };

  const retryFailedFiles = async () => {
    const failedIndices = parsingErrors.map((e) => e.fileIndex);
    const filesToRetry = selectedFiles.filter((_, index) => failedIndices.includes(index));

    if (filesToRetry.length === 0) return;

    try {
      setParsing(true);

      const retryResults: Array<Awaited<ReturnType<typeof parseDocument>> | {
        collectionDate: null;
        testType: null;
        tests: never[];
        notes: undefined;
        isVerified: false;
        verificationDetails: undefined;
        error: unknown;
        fileIndex: number;
      }> = [];

      for (let arrayIndex = 0; arrayIndex < filesToRetry.length; arrayIndex++) {
        const file = filesToRetry[arrayIndex];
        const originalIndex = failedIndices[arrayIndex];
        try {
          const mimeType = file.type === "pdf" ? "application/pdf" : "image/jpeg";
          const result = await parseDocument(
            file.uri,
            mimeType,
            profile ? { first_name: profile.first_name, last_name: profile.last_name } : undefined,
            `File ${originalIndex + 1} of ${selectedFiles.length}`
          );
          retryResults.push(result);
        } catch (error) {
          retryResults.push({
            collectionDate: null,
            testType: null,
            tests: [],
            notes: undefined,
            isVerified: false,
            verificationDetails: undefined,
            error,
            fileIndex: originalIndex,
          });
        }
      }

      // Process retry results
      let newResults: STIResult[] = [...extractedResults];
      let collectionDateVal: string = testDate;
      let testTypeVal: string = testType;
      const extractedNotesArr: string[] = notes ? [notes] : [];
      let verified = isVerified;
      const vDetailsList = [...verificationDetails];
      const remainingErrors: Array<{ fileIndex: number; fileName: string; error: DocumentParsingError }> = [];

      retryResults.forEach((parsed: unknown, arrayIndex: number) => {
        const originalIndex = failedIndices[arrayIndex];
        const doc = parsed as {
          error?: unknown;
          collectionDate?: string;
          testType?: string;
          notes?: string;
          isVerified?: boolean;
          verificationDetails?: {
            labName?: string;
            patientName?: string;
            hasHealthCard: boolean;
            hasAccessionNumber: boolean;
            nameMatched: boolean;
          };
          tests?: Array<{ name: string; result: string; status: TestStatus }>;
        };

        if (doc.error) {
          if (doc.error instanceof DocumentParsingError) {
            remainingErrors.push({ fileIndex: originalIndex, fileName: selectedFiles[originalIndex].name, error: doc.error });
          }
          return;
        }

        if (!collectionDateVal && doc.collectionDate) collectionDateVal = doc.collectionDate;
        if (!testTypeVal && doc.testType) testTypeVal = doc.testType;
        if (doc.notes) extractedNotesArr.push(doc.notes);
        if (doc.isVerified) verified = true;
        if (doc.verificationDetails) {
          const labName = doc.verificationDetails.labName;
          if (!vDetailsList.some((v) => v.labName === labName)) {
            vDetailsList.push(doc.verificationDetails);
          }
        }

        if (doc.tests && doc.tests.length > 0) {
          const results: STIResult[] = doc.tests.map((t) => ({ name: t.name, result: t.result, status: t.status }));
          newResults = [...newResults, ...results];
        }
      });

      if (collectionDateVal) setTestDate(collectionDateVal);

      if (newResults.length > 0) {
        const deduplicationResult = deduplicateTestResults(newResults);
        setExtractedResults(deduplicationResult.tests);
        setResultConflicts(deduplicationResult.conflicts);
        const combinedTestType = determineTestType(deduplicationResult.tests);
        setTestType(combinedTestType);
        const allNegative = deduplicationResult.tests.every((t) => t.status === "negative");
        const anyPositive = deduplicationResult.tests.some((t) => t.status === "positive");
        setOverallStatus(anyPositive ? "positive" : allNegative ? "negative" : "pending");
      } else if (testTypeVal) {
        setTestType(testTypeVal);
      }

      setNotes(extractedNotesArr.join("\n\n"));
      setIsVerified(verified);
      setVerificationDetails(vDetailsList);
      setParsingErrors(remainingErrors);

      const successCount = filesToRetry.length - remainingErrors.length;
      if (remainingErrors.length === 0) {
        Alert.alert("Success", `Successfully processed all ${successCount} file(s) on retry!`);
      } else {
        Alert.alert("Partial Success", `Processed ${successCount}/${filesToRetry.length} file(s) on retry. ${remainingErrors.length} still failed.`);
      }
    } catch (error) {
      Alert.alert("Retry Failed", error instanceof Error ? error.message : "Please try again or enter manually.");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    const existingResult = results.find((r) => r.test_date === testDate);
    if (existingResult) {
      Alert.alert(
        "Duplicate Test Date",
        `You already have results from ${testDate}. Do you want to add another result for this date?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => router.replace("/dashboard") },
          { text: "Add Anyway", onPress: submitResult },
        ]
      );
      return;
    }
    await submitResult();
  };

  const submitResult = async () => {
    try {
      setUploading(true);

      const result = await createResult({
        test_date: testDate,
        status: overallStatus,
        test_type: testType,
        sti_results: extractedResults,
        notes: notes || undefined,
        is_verified: isVerified,
      });

      if (result) {
        // Auto-add positive status STIs to known conditions
        const newStatusPositives = extractedResults.filter(
          (sti) => sti.status === "positive" && isStatusSTI(sti.name) && !hasKnownCondition(sti.name)
        );
        for (const sti of newStatusPositives) {
          await addKnownCondition(sti.name);
        }

        // Update reminder based on risk level
        const hasRoutine = extractedResults.some((sti) =>
          ROUTINE_TESTS.some((r) => sti.name.toLowerCase().includes(r))
        );

        if (profile?.risk_level && hasRoutine) {
          const riskLevel = profile.risk_level;
          const intervalDays = RISK_INTERVALS[riskLevel];
          const nextDueDate = parseDateOnly(testDate);
          nextDueDate.setDate(nextDueDate.getDate() + intervalDays);
          const nextDateStr = toDateString(nextDueDate);

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
          { text: "View Result", onPress: () => router.replace(`/results/${result.id}`) },
          { text: "Go to Dashboard", onPress: () => router.replace("/dashboard") },
        ]);
      } else {
        Alert.alert("Couldn't Save", "We couldn't save your test result. This might be a connection issue. Please check your internet and try again.");
      }
    } catch (error) {
      Alert.alert(
        "Upload Failed",
        error instanceof Error
          ? error.message
          : "We couldn't upload your test result. Please check your internet connection and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // Render the appropriate step
  if (step === "select") {
    return (
      <SelectStep
        isDark={isDark}
        onPickImage={pickImage}
        onPickPDF={pickPDF}
      />
    );
  }

  if (step === "preview") {
    return (
      <PreviewStep
        isDark={isDark}
        selectedFiles={selectedFiles}
        maxFiles={MAX_FILES_LIMIT}
        onBack={() => {
          setSelectedFiles([]);
          setStep("select");
        }}
        onRemoveFile={removeFile}
        onAddMore={() => setStep("select")}
        onContinue={async () => {
          setStep("details");
          await parseDocuments();
        }}
      />
    );
  }

  return (
    <DetailsStep
      isDark={isDark}
      selectedFiles={selectedFiles}
      parsing={parsing}
      parsingProgress={parsingProgress}
      uploading={uploading}
      testDate={testDate}
      setTestDate={setTestDate}
      testType={testType}
      setTestType={setTestType}
      extractedResults={extractedResults}
      setExtractedResults={setExtractedResults}
      notes={notes}
      setNotes={setNotes}
      isVerified={isVerified}
      verificationDetails={verificationDetails}
      resultConflicts={resultConflicts}
      parsingErrors={parsingErrors}
      hasProfile={!!profile}
      onBack={() => !parsing && setStep(selectedFiles.length > 0 ? "preview" : "select")}
      onCancel={handleCancelParsing}
      onRetryFailed={retryFailedFiles}
      onSubmit={handleSubmit}
    />
  );
}
