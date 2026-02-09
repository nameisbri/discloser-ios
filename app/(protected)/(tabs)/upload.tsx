import { useState, useEffect, useRef, useCallback } from "react";
import { Alert, BackHandler } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
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
  groupParsedDocumentsByDate,
} from "../../../lib/parsing";
import type { DateGroupedResult, ParsedDocumentForGrouping, VerificationResult } from "../../../lib/parsing";
import { isStatusSTI } from "../../../lib/parsing/testNormalizer";
import { ROUTINE_TESTS } from "../../../lib/constants";
import { parseDateOnly, toDateString } from "../../../lib/utils/date";
import { getMostRecentRoutineTestDate, TESTING_INTERVALS, RISK_FREQUENCY } from "../../../lib/utils/testingRecommendations";

// Maximum number of files that can be uploaded at once
const MAX_FILES_LIMIT = 4;

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
  const [dateGroupedResults, setDateGroupedResults] = useState<DateGroupedResult[]>([]);

  // Ref to track if parsing was cancelled
  const cancelledRef = useRef(false);

  // Ref to track if user is mid-flow (parsing or uploading) to prevent
  // useFocusEffect from resetting state during an active operation
  const flowActiveRef = useRef(false);

  // Resets all upload state to initial values so the screen is fresh
  const resetUploadState = useCallback(() => {
    setStep("select");
    setSelectedFiles([]);
    setUploading(false);
    setParsing(false);
    setParsingProgress(null);
    setParsingErrors([]);
    setTestDate(toDateString(new Date()));
    setTestType("Full STI Panel");
    setOverallStatus("negative");
    setExtractedResults([]);
    setNotes("");
    setIsVerified(false);
    setVerificationDetails([]);
    setResultConflicts([]);
    setDateGroupedResults([]);
    cancelledRef.current = false;
    flowActiveRef.current = false;
  }, []);

  // When the upload tab gains focus, reset to a fresh state unless the user
  // is actively in the middle of parsing or uploading (flowActiveRef guards this).
  useFocusEffect(
    useCallback(() => {
      if (!flowActiveRef.current) {
        resetUploadState();
      }
    }, [resetUploadState])
  );

  // Prevent back navigation on the entire details step.
  // The Cancel button is the only way to leave without saving.
  useEffect(() => {
    if (step !== "details") return;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => backHandler.remove();
  }, [step]);

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

  const handleCancel = () => {
    cancelledRef.current = true;
    resetUploadState();
    router.replace("/(protected)/(tabs)/dashboard");
  };

  const parseDocuments = async () => {
    if (selectedFiles.length === 0) return;

    // Reset cancellation flag
    cancelledRef.current = false;

    try {
      flowActiveRef.current = true;
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
    // Phase 1: Separate errors from successful documents
    const errors: Array<{ fileIndex: number; fileName: string; error: DocumentParsingError }> = [];
    const errorTypes = { network: 0, ocr: 0, llm_parsing: 0, other: 0 };
    const successfulDocs: ParsedDocumentForGrouping[] = [];

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
        verificationResult?: VerificationResult;
        contentHash?: string;
        contentSimhash?: string;
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

      // Convert successful doc to the grouping input format
      successfulDocs.push({
        collectionDate: doc.collectionDate || null,
        testType: doc.testType || null,
        tests: doc.tests || [],
        notes: doc.notes,
        isVerified: doc.isVerified || false,
        verificationDetails: doc.verificationDetails,
        verificationResult: doc.verificationResult,
        contentHash: doc.contentHash,
        contentSimhash: doc.contentSimhash,
      });
    });

    setParsingErrors(errors);

    // Phase 2: Group successful documents by date
    const groups = groupParsedDocumentsByDate(successfulDocs);
    setDateGroupedResults(groups);

    // Phase 3: Set existing single-result state from the first group
    // for backward compatibility with the current DetailsStep UI
    let uniqueTestCount = 0;
    if (groups.length > 0) {
      const firstGroup = groups[0];
      setTestDate(firstGroup.date || toDateString(new Date()));
      setExtractedResults(firstGroup.tests);
      setTestType(firstGroup.testType);
      setOverallStatus(firstGroup.overallStatus);
      setNotes(firstGroup.notes);
      setIsVerified(firstGroup.isVerified);
      setVerificationDetails(firstGroup.verificationDetails);
      setResultConflicts(firstGroup.conflicts);

      // Count unique tests across ALL groups for the alert message
      uniqueTestCount = groups.reduce((sum, g) => sum + g.tests.length, 0);
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
      flowActiveRef.current = true;
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
      flowActiveRef.current = false;
    }
  };

  const submitAllResults = () => {
    // Find the worst (lowest-scoring) verification result across all groups
    const worstResult = dateGroupedResults.reduce<VerificationResult | undefined>((worst, g) => {
      const r = g.verificationResult;
      if (!r) return worst;
      if (!worst || r.score < worst.score) return r;
      return worst;
    }, undefined);

    const proceed = confirmLowVerification(worstResult, () => {
      performSubmitAll();
    });
    if (!proceed) return;
    performSubmitAll();
  };

  const performSubmitAll = async () => {
    try {
      flowActiveRef.current = true;
      setUploading(true);

      const savedCount = { success: 0, failed: 0 };
      const allPositiveTests: STIResult[] = [];
      let mostRecentDate: string | null = null;
      let hasRoutineTests = false;

      for (const group of dateGroupedResults) {
        try {
          const groupDate = group.date || toDateString(new Date());

          const result = await createResult({
            test_date: groupDate,
            status: group.overallStatus,
            test_type: group.testType,
            sti_results: group.tests,
            notes: group.notes || undefined,
            is_verified: group.verificationResult?.isVerified ?? group.isVerified,
            verification_score: group.verificationResult?.score ?? null,
            verification_level: group.verificationResult?.level ?? null,
            verification_checks: group.verificationResult?.checks ?? null,
            content_hash: group.contentHashes[0] ?? null,
            content_simhash: group.contentSimhashes[0] ?? null,
          });

          if (result) {
            savedCount.success++;

            // Collect positive status STIs for auto-adding known conditions
            const positives = group.tests.filter(
              (sti) => sti.status === "positive" && isStatusSTI(sti.name) && !hasKnownCondition(sti.name)
            );
            allPositiveTests.push(...positives);

            // Track whether any group has routine tests (for reminder calculation)
            const groupHasRoutine = group.tests.some((sti) =>
              ROUTINE_TESTS.some((r) => sti.name.toLowerCase().includes(r))
            );
            if (groupHasRoutine) hasRoutineTests = true;

            // Track the most recent date across all groups
            if (!mostRecentDate || groupDate > mostRecentDate) {
              mostRecentDate = groupDate;
            }
          } else {
            savedCount.failed++;
          }
        } catch {
          savedCount.failed++;
        }
      }

      // Auto-add known conditions for all positive status STIs across all groups
      // Deduplicate by name so we don't try to add the same condition twice
      const uniquePositives = new Map<string, STIResult>();
      for (const sti of allPositiveTests) {
        if (!uniquePositives.has(sti.name)) {
          uniquePositives.set(sti.name, sti);
        }
      }
      for (const sti of uniquePositives.values()) {
        await addKnownCondition(sti.name);
      }

      // Update reminder based on risk level using the most recent date
      // Compare against ALL existing results to avoid older uploads overriding newer ones
      if (profile?.risk_level && hasRoutineTests && mostRecentDate) {
        const riskLevel = profile.risk_level;
        const intervalDays = TESTING_INTERVALS[riskLevel];
        const baseDate = getMostRecentRoutineTestDate(results, mostRecentDate, hasRoutineTests);
        const nextDueDate = parseDateOnly(baseDate);
        nextDueDate.setDate(nextDueDate.getDate() + intervalDays);
        const nextDateStr = toDateString(nextDueDate);

        const routineReminder = activeReminders.find((r) => r.title === "Routine Checkup");
        if (routineReminder) {
          await updateReminder(routineReminder.id, {
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

      // Show appropriate alert based on partial vs full success
      if (savedCount.failed === 0) {
        Alert.alert(
          "Success",
          `Saved ${savedCount.success} test result${savedCount.success !== 1 ? "s" : ""}!`,
          [
            {
              text: "Go to Dashboard",
              onPress: () => {
                resetUploadState();
                router.replace("/(protected)/(tabs)/dashboard");
              },
            },
          ]
        );
      } else if (savedCount.success > 0) {
        Alert.alert(
          "Partially Saved",
          `Saved ${savedCount.success} of ${dateGroupedResults.length} result${dateGroupedResults.length !== 1 ? "s" : ""}. ${savedCount.failed} could not be saved.`,
          [
            {
              text: "Go to Dashboard",
              onPress: () => {
                resetUploadState();
                router.replace("/(protected)/(tabs)/dashboard");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Couldn't Save",
          "We couldn't save your test results. This might be a connection issue. Please check your internet and try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Upload Failed",
        error instanceof Error
          ? error.message
          : "We couldn't upload your test results. Please check your internet connection and try again."
      );
    } finally {
      setUploading(false);
      flowActiveRef.current = false;
    }
  };

  /**
   * Checks verification status and shows a confirmation dialog for unverified results.
   * Returns true if the save should proceed immediately, false if a dialog was shown
   * (the onProceed callback will be called if the user confirms).
   */
  const confirmLowVerification = (
    verificationResult: VerificationResult | undefined,
    onProceed: () => void,
  ): boolean => {
    // No scoring data (e.g. retry flow): proceed without friction
    if (!verificationResult) return true;

    // Hard block: future dates are impossible — do not allow saving
    if (verificationResult.hasFutureDate) {
      Alert.alert(
        "Invalid Date",
        "The collection date on this document is in the future. This cannot be a valid test result.\n\nPlease check the document and try again.",
        [{ text: "OK", onPress: () => resetUploadState() }]
      );
      return false;
    }

    const { score, isVerified } = verificationResult;

    // Verified results proceed without friction
    if (isVerified) return true;

    if (score === 0) {
      Alert.alert(
        "No Lab Information Detected",
        "We couldn't detect any lab information from this document. This may not be a valid test result.\n\nPlease upload a clear photo or PDF of your lab report.",
        [
          { text: "Go Back", style: "cancel" },
          { text: "Save Anyway", style: "destructive", onPress: onProceed },
        ]
      );
      return false;
    }

    if (score < 25) {
      Alert.alert(
        "Low Confidence Result",
        "This document has very few verification signals. Make sure you're uploading an authentic lab report.",
        [
          { text: "Go Back", style: "cancel" },
          { text: "Save Anyway", style: "destructive", onPress: onProceed },
        ]
      );
      return false;
    }

    // Score 25+ but not verified — build specific reason from failed checks
    const reasons: string[] = [];
    const checks = verificationResult.checks;
    const labFailed = checks.find((c) => c.name === "recognized_lab")?.passed === false;
    const nameFailed = checks.find((c) => c.name === "name_match")?.passed === false;

    if (labFailed) reasons.push("The lab was not recognized");
    if (nameFailed) reasons.push("The patient name doesn't match your profile");
    if (reasons.length === 0) reasons.push("Some verification checks did not pass");

    Alert.alert(
      "Unverified Result",
      `${reasons.join(". ")}.\n\nThis result will be saved but won't be marked as verified.`,
      [
        { text: "Go Back", style: "cancel" },
        { text: "Save Anyway", onPress: onProceed },
      ]
    );
    return false;
  };

  /**
   * Checks for duplicate documents (exact content hash match).
   * Shows an alert and calls onSave if the user confirms, or proceeds directly if no duplicate.
   */
  const checkDuplicateAndSave = (contentHash: string | undefined, onSave: () => void) => {
    if (contentHash) {
      const duplicateResult = results.find((r) => r.content_hash === contentHash);
      if (duplicateResult) {
        const dupDate = duplicateResult.test_date;
        Alert.alert(
          "Duplicate Document",
          `You've already uploaded this exact document${dupDate ? ` (saved on ${dupDate})` : ""}. Uploading it again will create a duplicate entry.`,
          [
            { text: "Go Back", style: "cancel" },
            { text: "Save Anyway", style: "destructive", onPress: onSave },
          ]
        );
        return;
      }
    }

    onSave();
  };

  const handleSubmit = async () => {
    const contentHash = dateGroupedResults[0]?.contentHashes[0];

    // Check for unverified result first
    const proceed = confirmLowVerification(dateGroupedResults[0]?.verificationResult, () => {
      // User confirmed "Save Anyway" — check for duplicate document then save
      checkDuplicateAndSave(contentHash, submitResult);
    });
    if (!proceed) return;

    // Verified or no scoring data: check for duplicate document then save
    checkDuplicateAndSave(contentHash, submitResult);
  };

  const submitResult = async () => {
    try {
      flowActiveRef.current = true;
      setUploading(true);

      // Use verification result from first group if available
      const firstGroupResult = dateGroupedResults[0]?.verificationResult;
      const result = await createResult({
        test_date: testDate,
        status: overallStatus,
        test_type: testType,
        sti_results: extractedResults,
        notes: notes || undefined,
        is_verified: firstGroupResult?.isVerified ?? isVerified,
        verification_score: firstGroupResult?.score ?? null,
        verification_level: firstGroupResult?.level ?? null,
        verification_checks: firstGroupResult?.checks ?? null,
        content_hash: dateGroupedResults[0]?.contentHashes[0] ?? null,
        content_simhash: dateGroupedResults[0]?.contentSimhashes[0] ?? null,
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
          const intervalDays = TESTING_INTERVALS[riskLevel];
          const baseDate = getMostRecentRoutineTestDate(results, testDate, hasRoutine);
          const nextDueDate = parseDateOnly(baseDate);
          nextDueDate.setDate(nextDueDate.getDate() + intervalDays);
          const nextDateStr = toDateString(nextDueDate);

          const routineReminder = activeReminders.find((r) => r.title === "Routine Checkup");
          if (routineReminder) {
            await updateReminder(routineReminder.id, {
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
            onPress: () => {
              resetUploadState();
              router.replace(`/results/${result.id}`);
            },
          },
          {
            text: "Go to Dashboard",
            onPress: () => {
              resetUploadState();
              router.replace("/dashboard");
            },
          },
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
      flowActiveRef.current = false;
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
      dateGroupedResults={dateGroupedResults}
      onCancel={handleCancel}
      onRetryFailed={retryFailedFiles}
      onSubmit={handleSubmit}
      onSubmitAll={submitAllResults}
    />
  );
}
