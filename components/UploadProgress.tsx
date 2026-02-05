import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { X, Check, Loader2, FileSearch, FileCheck } from "lucide-react-native";
import { useTheme } from "../context/theme";
import { announceForAccessibility } from "../lib/utils/accessibility";
import { hapticImpact } from "../lib/utils/haptics";

type UploadStep = "uploading" | "processing" | "complete";

interface UploadProgressProps {
  /**
   * Current step in the upload process
   */
  currentStep: UploadStep;

  /**
   * Progress percentage (0-100) for current step
   */
  progress: number;

  /**
   * Callback when cancel button is pressed
   */
  onCancel: () => void;

  /**
   * Estimated time remaining in seconds
   */
  estimatedTimeRemaining?: number;

  /**
   * Current file being processed (e.g., "2 of 4")
   */
  currentFile?: string;

  /**
   * Whether cancel is allowed at this stage
   */
  canCancel?: boolean;
}

interface StepConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * UploadProgress - Multi-step progress indicator for file upload flow
 *
 * Shows three steps: Upload, Processing, Review
 * Includes progress bar, estimated time, and cancel capability
 */
export function UploadProgress({
  currentStep,
  progress,
  onCancel,
  estimatedTimeRemaining,
  currentFile,
  canCancel = true,
}: UploadProgressProps) {
  const { isDark } = useTheme();

  const steps: Record<UploadStep, StepConfig> = {
    uploading: {
      label: "Uploading",
      description: currentFile ? `Uploading ${currentFile}` : "Uploading files...",
      icon: (
        <Loader2
          size={24}
          color={isDark ? "#FF2D7A" : "#923D5C"}
          className="animate-spin"
        />
      ),
    },
    processing: {
      label: "Processing",
      description: currentFile
        ? `Analyzing ${currentFile}`
        : "Extracting test results...",
      icon: <FileSearch size={24} color={isDark ? "#FF2D7A" : "#923D5C"} />,
    },
    complete: {
      label: "Complete",
      description: "Ready for review",
      icon: <FileCheck size={24} color={isDark ? "#00E5A0" : "#10B981"} />,
    },
  };

  const stepOrder: UploadStep[] = ["uploading", "processing", "complete"];
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const currentConfig = steps[currentStep];

  // Announce step changes to screen readers
  useEffect(() => {
    announceForAccessibility(
      `${currentConfig.label}: ${currentConfig.description}`
    );
  }, [currentStep, currentConfig]);

  const handleCancel = async () => {
    await hapticImpact("heavy");
    onCancel();
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s remaining`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s remaining`;
  };

  return (
    <View
      className={`rounded-2xl p-6 border ${
        isDark
          ? "bg-dark-surface border-dark-border"
          : "bg-background-card border-border"
      }`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: progress,
        text: `${currentConfig.label}, ${progress}% complete`,
      }}
    >
      {/* Step Indicators */}
      <View className="flex-row justify-between mb-6">
        {stepOrder.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex;
          const stepConfig = steps[step];

          return (
            <View
              key={step}
              className="flex-1 items-center"
              accessibilityLabel={`Step ${index + 1}: ${stepConfig.label}, ${
                isComplete ? "completed" : isActive ? "in progress" : "pending"
              }`}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                  isComplete
                    ? isDark
                      ? "bg-dark-success-bg"
                      : "bg-success-light"
                    : isActive
                    ? isDark
                      ? "bg-dark-accent-muted"
                      : "bg-primary-muted"
                    : isDark
                    ? "bg-dark-surface-light"
                    : "bg-gray-100"
                }`}
              >
                {isComplete ? (
                  <Check size={20} color={isDark ? "#00E5A0" : "#10B981"} />
                ) : isActive ? (
                  stepConfig.icon
                ) : (
                  <Text
                    className={`font-inter-bold ${
                      isDark ? "text-dark-text-muted" : "text-text-muted"
                    }`}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                className={`text-xs font-inter-medium ${
                  isActive
                    ? isDark
                      ? "text-dark-accent"
                      : "text-primary"
                    : isComplete
                    ? isDark
                      ? "text-dark-success"
                      : "text-success"
                    : isDark
                    ? "text-dark-text-muted"
                    : "text-text-muted"
                }`}
              >
                {stepConfig.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Progress Bar */}
      <View
        className={`h-2 rounded-full mb-4 overflow-hidden ${
          isDark ? "bg-dark-surface-light" : "bg-gray-100"
        }`}
      >
        <View
          className={`h-full rounded-full ${
            currentStep === "complete"
              ? isDark
                ? "bg-dark-success"
                : "bg-success"
              : isDark
              ? "bg-dark-accent"
              : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </View>

      {/* Status Text */}
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className={`font-inter-medium ${
            isDark ? "text-dark-text" : "text-text"
          }`}
        >
          {currentConfig.description}
        </Text>
        <Text
          className={`text-sm font-inter-regular ${
            isDark ? "text-dark-text-secondary" : "text-text-light"
          }`}
        >
          {progress}%
        </Text>
      </View>

      {/* Estimated Time & Cancel */}
      <View className="flex-row justify-between items-center">
        {estimatedTimeRemaining !== undefined && currentStep !== "complete" ? (
          <Text
            className={`text-sm font-inter-regular ${
              isDark ? "text-dark-text-muted" : "text-text-muted"
            }`}
          >
            {formatTime(estimatedTimeRemaining)}
          </Text>
        ) : (
          <View />
        )}

        {canCancel && currentStep !== "complete" && (
          <Pressable
            onPress={handleCancel}
            className={`flex-row items-center px-4 py-2 rounded-xl ${
              isDark ? "bg-dark-surface-light" : "bg-gray-100"
            }`}
            accessibilityLabel="Cancel upload"
            accessibilityRole="button"
            accessibilityHint="Cancels the current upload and returns to file selection"
          >
            <X size={16} color={isDark ? "#C9A0DC" : "#6B7280"} />
            <Text
              className={`ml-2 font-inter-medium text-sm ${
                isDark ? "text-dark-text-secondary" : "text-text-light"
              }`}
            >
              Cancel
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default UploadProgress;
