import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Check, X, Info, Calendar, ShieldCheck } from "lucide-react-native";
import { Button } from "../Button";
import { HeaderLogo } from "../HeaderLogo";
import { parseDateOnly } from "../../lib/utils/date";


// Helper functions for progress display
function getProgressTitle(step: "uploading" | "extracting" | "parsing"): string {
  switch (step) {
    case "uploading":
      return "Preparing document...";
    case "extracting":
      return "Reading text...";
    case "parsing":
      return "Analyzing results...";
  }
}

function getProgressDescription(step: "uploading" | "extracting" | "parsing"): string {
  switch (step) {
    case "uploading":
      return "Getting your document ready";
    case "extracting":
      return "Scanning your document";
    case "parsing":
      return "Finding and organizing test results";
  }
}
import { isRetryableError } from "../../lib/http/errors";
import type { STIResult, TestStatus } from "../../lib/types";
import type { DocumentParsingError, TestConflict, DateGroupedResult, VerificationResult } from "../../lib/parsing";
import type { SelectedFile } from "./PreviewStep";

// Formats a YYYY-MM-DD string as a long-form date (e.g., "December 15, 2025")
function formatDateLong(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Returns a human-readable label for an overall status
function getStatusLabel(status: TestStatus): string {
  switch (status) {
    case "negative":
      return "All Negative";
    case "positive":
      return "Has Positive";
    case "pending":
      return "Pending";
    case "inconclusive":
      return "Inconclusive";
  }
}

// Returns the background color class for a status pill
function getStatusBgClass(status: TestStatus, isDark: boolean): string {
  switch (status) {
    case "negative":
      return isDark ? "bg-dark-success-bg" : "bg-success-light/50";
    case "positive":
      return isDark ? "bg-dark-danger-bg" : "bg-danger-light/50";
    case "pending":
    case "inconclusive":
      return isDark ? "bg-dark-warning-bg" : "bg-warning-light/50";
  }
}

// Returns the text color class for a status label
function getStatusTextClass(status: TestStatus, isDark: boolean): string {
  switch (status) {
    case "negative":
      return isDark ? "text-dark-mint" : "text-success";
    case "positive":
      return isDark ? "text-dark-danger" : "text-danger";
    case "pending":
    case "inconclusive":
      return isDark ? "text-dark-warning" : "text-warning-dark";
  }
}

interface VerificationDetails {
  labName?: string;
  patientName?: string;
  hasHealthCard: boolean;
  hasAccessionNumber: boolean;
  nameMatched: boolean;
}

interface ParsingError {
  fileIndex: number;
  fileName: string;
  error: DocumentParsingError;
}

interface ParsingProgress {
  currentFile: number;
  totalFiles: number;
  step: "uploading" | "extracting" | "parsing";
}

interface DetailsStepProps {
  isDark: boolean;
  selectedFiles: SelectedFile[];
  parsing: boolean;
  parsingProgress: ParsingProgress | null;
  uploading: boolean;
  // Form state
  testDate: string;
  setTestDate: (date: string) => void;
  testType: string;
  setTestType: (type: string) => void;
  extractedResults: STIResult[];
  setExtractedResults: (results: STIResult[]) => void;
  notes: string;
  setNotes: (notes: string) => void;
  isVerified: boolean;
  verificationDetails: VerificationDetails[];
  resultConflicts: TestConflict[];
  parsingErrors: ParsingError[];
  hasProfile: boolean;
  // Multi-date grouping
  dateGroupedResults?: DateGroupedResult[];
  // Callbacks
  onCancel: () => void;
  onRetryFailed: () => void;
  onSubmit: () => void;
  onSubmitAll?: () => void;
}

export function DetailsStep({
  isDark,
  selectedFiles,
  parsing,
  parsingProgress,
  uploading,
  testDate,
  setTestDate,
  testType,
  setTestType,
  extractedResults,
  setExtractedResults,
  notes,
  setNotes,
  isVerified,
  verificationDetails,
  resultConflicts,
  parsingErrors,
  hasProfile,
  dateGroupedResults,
  onCancel,
  onRetryFailed,
  onSubmit,
  onSubmitAll,
}: DetailsStepProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateResultName = (index: number, name: string) => {
    setValidationErrors([]);
    const updated = [...extractedResults];
    updated[index] = { ...updated[index], name };
    setExtractedResults(updated);
  };

  const validateResults = (): boolean => {
    const errors: string[] = [];
    extractedResults.forEach((r, i) => {
      if (!r.name.trim()) {
        errors.push(`Result ${i + 1}: Test name is required`);
      }
    });
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleValidatedSubmit = () => {
    if (validateResults()) {
      onSubmit();
    }
  };

  // Determine if we should show the multi-date grouped view.
  // Only when there are 2 or more date groups from the parsed documents.
  const isMultiDate = dateGroupedResults !== undefined && dateGroupedResults.length > 1;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center px-6 py-4">
          <View className="ml-2">
            <HeaderLogo showText />
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Show attached files summary */}
          {selectedFiles.length > 0 && (
            <View className={`p-4 rounded-2xl flex-row items-center mb-3 ${isDark ? "bg-dark-success-bg" : "bg-success-light/50"}`}>
              <Check size={20} color={isDark ? "#00E5A0" : "#28A745"} />
              <Text className={`font-inter-medium ml-2 flex-1 ${isDark ? "text-dark-mint" : "text-success"}`}>
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} attached
              </Text>
            </View>
          )}

          {/* Verification status */}
          {verificationDetails.length > 0 && (
            <VerificationStatus
              isDark={isDark}
              isVerified={isVerified}
              verificationDetails={verificationDetails}
              verificationResult={dateGroupedResults?.[0]?.verificationResult}
              hasProfile={hasProfile}
            />
          )}

          {/* Conflict warnings */}
          {!parsing && resultConflicts.length > 0 && (
            <ConflictWarnings isDark={isDark} conflicts={resultConflicts} />
          )}

          {/* Parsing errors */}
          {!parsing && parsingErrors.length > 0 && (
            <ParsingErrorsDisplay
              isDark={isDark}
              errors={parsingErrors}
              onRetry={onRetryFailed}
              onCancel={onCancel}
            />
          )}

          {/* Parsing in progress */}
          {parsing && (
            <View className={`p-6 rounded-3xl items-center mb-6 ${isDark ? "bg-dark-surface" : "bg-primary-light/20"}`}>
              <ActivityIndicator size="large" color={isDark ? "#FF2D7A" : "#923D5C"} />
              <Text className={`mt-4 text-xl font-inter-bold text-center ${isDark ? "text-dark-text" : "text-primary-dark"}`}>
                {parsingProgress
                  ? getProgressTitle(parsingProgress.step)
                  : "Processing your results..."}
              </Text>
              {parsingProgress && parsingProgress.totalFiles > 1 ? (
                <Text className={`mt-2 text-sm font-inter-regular text-center ${isDark ? "text-dark-accent" : "text-primary"}`}>
                  File {parsingProgress.currentFile} of {parsingProgress.totalFiles}
                </Text>
              ) : (
                <Text className={`mt-2 text-sm font-inter-regular text-center ${isDark ? "text-dark-accent" : "text-primary"}`}>
                  Reading {selectedFiles.length} document{selectedFiles.length > 1 ? "s" : ""}
                </Text>
              )}
              {/* Progress bar */}
              {parsingProgress && parsingProgress.totalFiles > 1 && (
                <View className={`w-full h-2 rounded-full mt-4 ${isDark ? "bg-dark-surface-light" : "bg-white/50"}`}>
                  <View
                    className={`h-2 rounded-full ${isDark ? "bg-dark-accent" : "bg-primary"}`}
                    style={{ width: `${(parsingProgress.currentFile / parsingProgress.totalFiles) * 100}%` }}
                  />
                </View>
              )}
              <Text className={`mt-3 text-xs font-inter-regular text-center ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                {parsingProgress
                  ? getProgressDescription(parsingProgress.step)
                  : "Hang tight, 15-30 seconds"}
              </Text>
              <Text className={`mt-2 text-xs font-inter-medium text-center ${isDark ? "text-dark-warning" : "text-warning-dark"}`}>
                Please stay in the app while we process
              </Text>
              <View className="flex-row items-center justify-center mt-3">
                <ShieldCheck size={14} color={isDark ? "#00E5A0" : "#10B981"} />
                <Text className={`text-xs font-inter-medium ml-1.5 ${isDark ? "text-dark-mint" : "text-success"}`}>
                  Processing on-device. Your data stays on your phone.
                </Text>
              </View>
              {onCancel && (
                <Pressable
                  onPress={onCancel}
                  className={`mt-4 px-6 py-3 rounded-xl ${isDark ? "bg-dark-surface-light" : "bg-white"}`}
                  accessibilityLabel="Cancel processing"
                  accessibilityRole="button"
                >
                  <Text className={`font-inter-semibold ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                    Cancel
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Multi-date view: shown when there are 2+ date groups */}
          {!parsing && isMultiDate && (
            <MultiDateSummary
              isDark={isDark}
              groups={dateGroupedResults!}
              uploading={uploading}
              onSubmitAll={onSubmitAll}
              onCancel={onCancel}
            />
          )}

          {/* Single-date view: the existing form UI, shown when 0 or 1 date group */}
          {!parsing && !isMultiDate && (
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
            </>
          )}

          {/* Extracted Results (single-date only) */}
          {!parsing && !isMultiDate && extractedResults.length > 0 && (
            <ExtractedResultsList
              isDark={isDark}
              results={extractedResults}
              onUpdateName={updateResultName}
              invalidIndices={new Set(
                validationErrors
                  .map((e) => {
                    const match = e.match(/^Result (\d+):/);
                    return match ? parseInt(match[1], 10) - 1 : -1;
                  })
                  .filter((i) => i >= 0)
              )}
            />
          )}

          {/* No results warning (single-date only) */}
          {!parsing && !isMultiDate && extractedResults.length === 0 && (
            <View className={`p-4 rounded-2xl mb-6 ${isDark ? "bg-dark-warning-bg" : "bg-warning-light/50"}`}>
              <View className="flex-row items-center mb-2">
                <Info size={20} color={isDark ? "#FFD700" : "#FFA500"} />
                <Text className={`font-inter-semibold ml-2 ${isDark ? "text-dark-warning" : "text-warning-dark"}`}>
                  No test results extracted
                </Text>
              </View>
              <Text className={`text-sm font-inter-regular ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                We couldn't find any test results in your document. Please try again with a clearer image or PDF, or make sure the document contains STI test results.
              </Text>
            </View>
          )}

          {!parsing && !isMultiDate && (
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

              {validationErrors.length > 0 && (
                <View className={`p-4 rounded-2xl mb-4 ${isDark ? "bg-dark-danger-bg" : "bg-danger-light/50"}`}>
                  <View className="flex-row items-center mb-1">
                    <Info size={16} color="#DC3545" />
                    <Text className={`font-inter-semibold ml-2 text-sm ${isDark ? "text-dark-danger" : "text-danger"}`}>
                      Please fix the following:
                    </Text>
                  </View>
                  {validationErrors.map((error, idx) => (
                    <Text key={idx} className={`text-xs font-inter-regular ml-6 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                      {error}
                    </Text>
                  ))}
                </View>
              )}

              <Button
                label={uploading ? "Saving..." : "Save Result"}
                onPress={handleValidatedSubmit}
                disabled={uploading || extractedResults.length === 0}
                className="mb-3"
                icon={uploading ? <ActivityIndicator size="small" color="white" /> : undefined}
              />
              <Button
                label="Discard"
                variant="outline"
                onPress={onCancel}
                disabled={uploading}
                className="mb-8"
                accessibilityHint="Discard results and return to dashboard"
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Sub-components for cleaner organization

function VerificationStatus({
  isDark,
  isVerified,
  verificationDetails,
  verificationResult,
  hasProfile,
}: {
  isDark: boolean;
  isVerified: boolean;
  verificationDetails: VerificationDetails[];
  verificationResult?: VerificationResult;
  hasProfile: boolean;
}) {
  // Use scoring checks when available for accurate pass/fail display
  const checks = verificationResult?.checks;
  const labCheck = checks?.find((c) => c.name === "recognized_lab");
  const healthCardCheck = checks?.find((c) => c.name === "health_card");
  const accessionCheck = checks?.find((c) => c.name === "accession_number");
  const nameCheck = checks?.find((c) => c.name === "name_match");
  const dateCheck = checks?.find((c) => c.name === "collection_date");

  // Fall back to legacy details for lab name and patient name display
  const firstDetails = verificationDetails[0];
  const labName = firstDetails?.labName;
  const patientName = firstDetails?.patientName;

  return (
    <View className={`p-4 rounded-2xl mb-3 ${isVerified ? (isDark ? "bg-dark-accent-muted" : "bg-primary-light/50") : (isDark ? "bg-dark-warning-bg" : "bg-warning-light/50")}`}>
      <View className="flex-row items-center mb-2">
        {isVerified ? (
          <Info size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
        ) : (
          <Info size={20} color={isDark ? "#FFD700" : "#FFA500"} />
        )}
        <Text className={`font-inter-semibold ml-2 ${isVerified ? (isDark ? "text-dark-accent" : "text-primary") : (isDark ? "text-dark-warning" : "text-warning-dark")}`}>
          {isVerified
            ? verificationDetails.length > 1
              ? `Auto-detected from ${verificationDetails.length} documents`
              : "Auto-detected from document"
            : "Could not auto-detect"}
        </Text>
      </View>

      {/* Lab recognition */}
      {labName && (
        labCheck?.passed ? (
          <VerificationRow isDark={isDark} passed>From: {labName}</VerificationRow>
        ) : (
          <VerificationRow isDark={isDark} passed={false}>Lab not recognized ({labName})</VerificationRow>
        )
      )}

      {/* Health card & accession — only meaningful when lab is recognized */}
      {labCheck?.passed ? (
        (healthCardCheck?.passed || accessionCheck?.passed) ? (
          <VerificationRow isDark={isDark} passed>
            {healthCardCheck?.passed && accessionCheck?.passed
              ? "Health card & accession number present"
              : healthCardCheck?.passed
              ? "Health card present"
              : "Accession number present"}
          </VerificationRow>
        ) : (
          <VerificationRow isDark={isDark} passed={false}>
            Missing health card or accession number
          </VerificationRow>
        )
      ) : (
        <VerificationRow isDark={isDark} passed={false}>
          Cannot verify identifiers (unrecognized lab)
        </VerificationRow>
      )}

      {/* Name match */}
      {patientName && hasProfile && (
        nameCheck?.passed ? (
          <VerificationRow isDark={isDark} passed>Name matches your profile</VerificationRow>
        ) : (
          <VerificationRow isDark={isDark} passed={false}>
            Name doesn't match your profile ({patientName})
          </VerificationRow>
        )
      )}

      {/* Date validity — only show when it fails */}
      {dateCheck && !dateCheck.passed && (
        <VerificationRow isDark={isDark} passed={false}>
          {dateCheck.details}
        </VerificationRow>
      )}

      {!isVerified && (
        <Text className={`text-xs font-inter-regular ml-7 mt-2 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
          {verificationResult?.hasFutureDate
            ? "This document cannot be saved because the date is in the future."
            : "You can still save this result, but it won't be marked as verified."}
        </Text>
      )}
    </View>
  );
}

function VerificationRow({ isDark, passed, children }: { isDark: boolean; passed: boolean; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center ml-7 mb-1">
      {passed ? (
        <Check size={14} color={isDark ? "#00E5A0" : "#28A745"} />
      ) : (
        <X size={14} color={isDark ? "#FF6B6B" : "#DC3545"} />
      )}
      <Text className={`text-xs font-inter-regular ml-1 ${passed ? (isDark ? "text-dark-mint" : "text-success") : (isDark ? "text-dark-danger" : "text-danger")}`}>
        {children}
      </Text>
    </View>
  );
}

function ConflictWarnings({
  isDark,
  conflicts,
}: {
  isDark: boolean;
  conflicts: TestConflict[];
}) {
  return (
    <View className={`p-4 rounded-2xl mb-4 ${isDark ? "bg-dark-warning-bg" : "bg-warning-light/50"}`}>
      <View className="flex-row items-center mb-2">
        <Info size={20} color={isDark ? "#FFD700" : "#FFA500"} />
        <Text className={`font-inter-semibold ml-2 ${isDark ? "text-dark-warning" : "text-warning-dark"}`}>
          Conflicting Results Detected
        </Text>
      </View>
      <Text className={`text-sm font-inter-regular mb-3 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
        These tests appeared with different results across your images. We've selected the most clinically relevant, but please verify:
      </Text>
      {conflicts.map((conflict, idx) => (
        <View key={idx} className={`p-3 rounded-xl mb-2 ${isDark ? "bg-dark-surface" : "bg-white"}`}>
          <Text className={`font-inter-semibold ${isDark ? "text-dark-text" : "text-text"}`}>
            {conflict.testName}
          </Text>
          <Text className={`text-xs font-inter-regular mt-1 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
            Found: {conflict.occurrences.map(o => o.status).join(", ")}
          </Text>
          <Text className={`text-xs font-inter-medium mt-1 ${isDark ? "text-dark-accent" : "text-primary"}`}>
            Selected: {conflict.suggested.status}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ParsingErrorsDisplay({
  isDark,
  errors,
  onRetry,
  onCancel,
}: {
  isDark: boolean;
  errors: ParsingError[];
  onRetry: () => void;
  onCancel: () => void;
}) {
  const hasRetryable = errors.some(
    (e) => e.error.step === "network" || e.error.step === "ocr" || isRetryableError(e.error.originalError)
  );

  return (
    <View className="mb-6">
      <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
        Processing Errors ({errors.length})
      </Text>

      {errors.map((errorInfo, idx) => {
        const canRetry = errorInfo.error.step === "network" || errorInfo.error.step === "ocr" || isRetryableError(errorInfo.error.originalError);

        return (
          <View
            key={idx}
            className={`border rounded-2xl p-4 mb-3 ${isDark ? "bg-dark-danger-bg border-dark-border" : "bg-danger-light border-danger"}`}
          >
            <View className="flex-row items-start mb-2">
              <X size={18} color="#DC3545" />
              <View className="flex-1 ml-2">
                <Text className={`font-inter-semibold mb-1 ${isDark ? "text-dark-danger" : "text-danger"}`}>
                  {errorInfo.fileName}
                </Text>
                <Text className={`font-inter-regular text-sm ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
                  {errorInfo.error.getUserMessage()}
                </Text>
                <Text className={`text-xs font-inter-medium mt-2 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                  Error type: {errorInfo.error.step}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {hasRetryable && (
        <Button
          label="Retry Auto-Extract"
          onPress={onRetry}
          variant="primary"
          className="mt-2"
        />
      )}
      <Button
        label="Cancel"
        variant="outline"
        onPress={onCancel}
        className="mt-2"
        accessibilityHint="Cancel and return to dashboard"
      />
    </View>
  );
}

function ExtractedResultsList({
  isDark,
  results,
  onUpdateName,
  invalidIndices,
}: {
  isDark: boolean;
  results: STIResult[];
  onUpdateName: (index: number, name: string) => void;
  invalidIndices?: Set<number>;
}) {
  return (
    <View className="mb-6">
      <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
        Extracted Test Results ({results.length})
      </Text>
      <View className="flex-row items-center mb-3">
        <Info size={14} color={isDark ? "#C9A0DC" : "#6B7280"} />
        <Text className={`text-xs font-inter-medium ml-1.5 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
          AI-assisted extraction. Review before saving.
        </Text>
      </View>
      {results.map((sti, index) => (
        <View key={index} className={`border rounded-2xl p-4 mb-3 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <View className="flex-row items-center gap-3">
            {/* Test name (editable) */}
            <View className="flex-1">
              <TextInput
                value={sti.name}
                onChangeText={(text) => onUpdateName(index, text)}
                placeholder="Test name"
                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"}
                returnKeyType="done"
                maxLength={100}
                className={`font-inter-semibold px-3 py-2 rounded-xl border ${
                  invalidIndices?.has(index)
                    ? "border-danger"
                    : "border-transparent"
                } ${
                  isDark
                    ? "bg-dark-surface-light text-dark-text"
                    : "bg-gray-50 text-text"
                }`}
                accessibilityLabel={`Test name for result ${index + 1}`}
              />
            </View>

            {/* Status pill (read-only) */}
            <View
              className={`px-4 py-2 rounded-full ${
                sti.status === "negative" ? "bg-success" : sti.status === "positive" ? "bg-danger" : "bg-warning"
              }`}
              accessibilityLabel={`${sti.name || "Result"}: ${sti.status}`}
            >
              <Text className="text-white text-xs font-inter-semibold">
                {sti.status.charAt(0).toUpperCase() + sti.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// Multi-date summary view shown when documents span 2+ collection dates
function MultiDateSummary({
  isDark,
  groups,
  uploading,
  onSubmitAll,
  onCancel,
}: {
  isDark: boolean;
  groups: DateGroupedResult[];
  uploading: boolean;
  onSubmitAll?: () => void;
  onCancel: () => void;
}) {
  const totalTests = groups.reduce((sum, g) => sum + g.tests.length, 0);

  return (
    <View>
      {/* Header explaining the multi-date situation */}
      <View className={`p-4 rounded-2xl mb-4 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light/50"}`}>
        <Text className={`font-inter-bold text-base ${isDark ? "text-dark-accent" : "text-primary"}`}>
          Found results from {groups.length} different dates
        </Text>
        <Text className={`text-sm font-inter-regular mt-1 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
          Your documents contain tests from multiple collection dates. Each date will be saved as a separate result.
        </Text>
      </View>

      {/* Date group cards */}
      {groups.map((group, index) => (
        <DateGroupCard
          key={group.date || `unknown-${index}`}
          isDark={isDark}
          group={group}
        />
      ))}

      {/* Action buttons */}
      <View className="mt-2">
        <Button
          label={uploading ? "Saving..." : `Save All Results (${totalTests})`}
          onPress={onSubmitAll || (() => {})}
          disabled={uploading || !onSubmitAll || totalTests === 0}
          className="mb-3"
          icon={uploading ? <ActivityIndicator size="small" color="white" /> : undefined}
        />
        <Button
          label="Discard"
          variant="outline"
          onPress={onCancel}
          disabled={uploading}
          className="mb-8"
          accessibilityHint="Discard all results and return to dashboard"
        />
      </View>
    </View>
  );
}

// Card component for a single date group within the multi-date summary
function DateGroupCard({
  isDark,
  group,
}: {
  isDark: boolean;
  group: DateGroupedResult;
}) {
  const dateLabel = group.date ? formatDateLong(group.date) : "Date Unknown";
  const testCount = group.tests.length;
  const statusLabel = getStatusLabel(group.overallStatus);
  const statusBg = getStatusBgClass(group.overallStatus, isDark);
  const statusText = getStatusTextClass(group.overallStatus, isDark);

  // Build a truncated list of test names for preview
  const MAX_PREVIEW_NAMES = 4;
  const testNames = group.tests.map((t) => t.name);
  const displayNames = testNames.slice(0, MAX_PREVIEW_NAMES);
  const remainingCount = testNames.length - displayNames.length;

  return (
    <View
      className={`border rounded-2xl p-4 mb-3 ${
        isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"
      }`}
      accessibilityLabel={`${dateLabel}: ${testCount} tests, ${statusLabel}`}
    >
      {/* Date header row */}
      <View className="flex-row items-center mb-2">
        <Calendar size={18} color={isDark ? "#FF2D7A" : "#923D5C"} />
        <Text className={`font-inter-bold text-base ml-2 flex-1 ${isDark ? "text-dark-text" : "text-text"}`}>
          {dateLabel}
        </Text>
      </View>

      {/* Test count and status row */}
      <View className="flex-row items-center mb-2">
        <Text className={`text-sm font-inter-medium ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>
          {testCount} test{testCount !== 1 ? "s" : ""}
        </Text>
        <Text className={`text-sm mx-2 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
          {"\u00B7"}
        </Text>
        <View className={`px-3 py-1 rounded-full ${statusBg}`}>
          <Text className={`text-xs font-inter-semibold ${statusText}`}>
            {statusLabel} {group.overallStatus === "negative" ? "\u2713" : group.overallStatus === "positive" ? "\u2717" : ""}
          </Text>
        </View>
      </View>

      {/* Test names preview */}
      {testCount > 0 && (
        <Text
          className={`text-xs font-inter-regular ${isDark ? "text-dark-text-muted" : "text-text-light"}`}
          numberOfLines={2}
        >
          {displayNames.join(", ")}{remainingCount > 0 ? `, +${remainingCount} more` : ""}
        </Text>
      )}

      {/* Conflict indicator if this group has conflicts */}
      {group.conflicts.length > 0 && (
        <View className="flex-row items-center mt-2">
          <Info size={14} color={isDark ? "#FFD700" : "#FFA500"} />
          <Text className={`text-xs font-inter-medium ml-1 ${isDark ? "text-dark-warning" : "text-warning-dark"}`}>
            {group.conflicts.length} conflicting result{group.conflicts.length !== 1 ? "s" : ""} resolved
          </Text>
        </View>
      )}
    </View>
  );
}
