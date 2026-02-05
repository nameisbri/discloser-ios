import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ChevronLeft, Check, X, Info } from "lucide-react-native";
import { Button } from "../Button";
import { hapticSelection } from "../../lib/utils/haptics";

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
      return "Using AI to read your document";
    case "parsing":
      return "Finding and organizing test results";
  }
}
import { isRetryableError } from "../../lib/http/errors";
import type { TestStatus, STIResult } from "../../lib/types";
import type { DocumentParsingError, TestConflict } from "../../lib/parsing";
import type { SelectedFile } from "./PreviewStep";

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
  // Callbacks
  onBack: () => void;
  onCancel?: () => void;
  onRetryFailed: () => void;
  onSubmit: () => void;
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
  onBack,
  onCancel,
  onRetryFailed,
  onSubmit,
}: DetailsStepProps) {
  const updateResultStatus = async (index: number, status: TestStatus) => {
    await hapticSelection();
    const updated = [...extractedResults];
    updated[index].status = status;
    setExtractedResults(updated);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-background"}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={onBack}
            disabled={parsing}
            className={`p-2 -ml-2 ${parsing ? "opacity-30" : ""}`}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={24} color={isDark ? "#FFFFFF" : "#374151"} />
          </Pressable>
          <Text className={`text-lg font-inter-semibold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
            Test Details
          </Text>
          <View className="w-10" />
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
            </>
          )}

          {/* Extracted Results */}
          {!parsing && extractedResults.length > 0 && (
            <ExtractedResultsList
              isDark={isDark}
              results={extractedResults}
              onUpdateStatus={updateResultStatus}
            />
          )}

          {/* No results warning */}
          {!parsing && extractedResults.length === 0 && (
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
                onPress={onSubmit}
                disabled={uploading || extractedResults.length === 0}
                className="mb-8"
                icon={uploading ? <ActivityIndicator size="small" color="white" /> : undefined}
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
  hasProfile,
}: {
  isDark: boolean;
  isVerified: boolean;
  verificationDetails: VerificationDetails[];
  hasProfile: boolean;
}) {
  return (
    <View className={`p-4 rounded-2xl mb-3 ${isVerified ? (isDark ? "bg-dark-accent-muted" : "bg-primary-light/50") : (isDark ? "bg-dark-warning-bg" : "bg-warning-light/50")}`}>
      <View className="flex-row items-center mb-2">
        {isVerified ? (
          <Check size={20} color={isDark ? "#FF2D7A" : "#923D5C"} />
        ) : (
          <Info size={20} color={isDark ? "#FFD700" : "#FFA500"} />
        )}
        <Text className={`font-inter-semibold ml-2 ${isVerified ? (isDark ? "text-dark-accent" : "text-primary") : (isDark ? "text-dark-warning" : "text-warning-dark")}`}>
          {isVerified
            ? verificationDetails.length > 1
              ? `${verificationDetails.length} documents verified`
              : "Document verified"
            : "Document not verified"}
        </Text>
      </View>

      {verificationDetails.map((details, idx) => (
        <View key={idx} className={idx > 0 ? "mt-2 pt-2 border-t border-white/10" : ""}>
          {details.labName && (
            <View className="flex-row items-center ml-7 mb-1">
              <Check size={14} color={isDark ? "#00E5A0" : "#28A745"} />
              <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-mint" : "text-success"}`}>
                From: {details.labName}
              </Text>
            </View>
          )}

          {(details.hasHealthCard || details.hasAccessionNumber) ? (
            <View className="flex-row items-center ml-7 mb-1">
              <Check size={14} color={isDark ? "#00E5A0" : "#28A745"} />
              <Text className={`text-xs font-inter-regular ml-1 ${isDark ? "text-dark-mint" : "text-success"}`}>
                {details.hasHealthCard && details.hasAccessionNumber
                  ? "Health card & accession number present"
                  : details.hasHealthCard
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

          {details.patientName && hasProfile && (
            details.nameMatched ? (
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
                  Name doesn't match your profile ({details.patientName})
                </Text>
              </View>
            )
          )}
        </View>
      ))}

      {!isVerified && (
        <Text className={`text-xs font-inter-regular ml-7 mt-2 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
          You can still save this result, but it won't be marked as verified.
        </Text>
      )}
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
}: {
  isDark: boolean;
  errors: ParsingError[];
  onRetry: () => void;
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
                {canRetry && (
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

      {hasRetryable && (
        <Button
          label="Retry Auto-Extract"
          onPress={onRetry}
          variant="secondary"
          className="mt-2"
        />
      )}
    </View>
  );
}

function ExtractedResultsList({
  isDark,
  results,
  onUpdateStatus,
}: {
  isDark: boolean;
  results: STIResult[];
  onUpdateStatus: (index: number, status: TestStatus) => void;
}) {
  return (
    <View className="mb-6">
      <Text className={`font-inter-semibold mb-3 ${isDark ? "text-dark-text" : "text-text"}`}>
        Extracted Test Results ({results.length})
      </Text>
      {results.map((sti, index) => (
        <View key={index} className={`border rounded-2xl p-4 mb-3 ${isDark ? "bg-dark-surface border-dark-border" : "bg-white border-border"}`}>
          <Text className={`font-inter-semibold mb-1 ${isDark ? "text-dark-text" : "text-text"}`}>{sti.name}</Text>
          <Text className={`font-inter-regular text-sm mb-2 ${isDark ? "text-dark-text-secondary" : "text-text-light"}`}>{sti.result}</Text>
          <View className="flex-row gap-2">
            {(["negative", "positive", "pending"] as TestStatus[]).map((status) => (
              <Pressable
                key={status}
                onPress={() => onUpdateStatus(index, status)}
                className={`px-4 py-2.5 rounded-full ${
                  sti.status === status
                    ? status === "negative" ? "bg-success" : status === "positive" ? "bg-danger" : "bg-warning"
                    : isDark ? "bg-dark-surface-light" : "bg-gray-100"
                }`}
                style={{ minHeight: 44, justifyContent: "center" }}
                accessibilityLabel={`Set ${sti.name} to ${status}`}
                accessibilityRole="button"
                accessibilityState={{ selected: sti.status === status }}
              >
                <Text className={sti.status === status ? "text-white text-xs font-inter-semibold" : isDark ? "text-dark-text-secondary text-xs" : "text-gray-600 text-xs"}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
