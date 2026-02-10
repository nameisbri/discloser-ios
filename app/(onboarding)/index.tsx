import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, ChevronLeft, User, Calendar, Heart, Activity } from "lucide-react-native";
import { WelcomeScreens } from "../../components/onboarding";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../context/theme";
import { useProfile } from "../../lib/hooks";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { supabase } from "../../lib/supabase";
import { SHARE_BASE_URL } from "../../lib/constants";
import { STATUS_STIS } from "../../lib/types";
import type { KnownCondition, RiskLevel } from "../../lib/types";
import { getMethodsForCondition, type ManagementMethod } from "../../lib/managementMethods";
import { toDateString } from "../../lib/utils/date";
import { trackOnboardingCompleted } from "../../lib/analytics";

const PRONOUNS_OPTIONS = ["he/him", "she/her", "they/them", "other"];

const RISK_QUESTIONS = [
  {
    id: "partners",
    question: "How many partners in the last year?",
    options: [
      { label: "0-1", points: 1 },
      { label: "2-5", points: 2 },
      { label: "6+ (we don't judge)", points: 3 },
    ],
  },
  {
    id: "protection",
    question: "How often do you use condoms or barriers?",
    options: [
      { label: "Always", points: 1 },
      { label: "Sometimes", points: 2 },
      { label: "Rarely or never", points: 3 },
    ],
  },
  {
    id: "status",
    question: "Any partners with unknown status?",
    options: [
      { label: "Nope, all clear", points: 1 },
      { label: "Yeah, or not sure", points: 2 },
    ],
  },
  {
    id: "history",
    question: "Had an STI in the past 2 years?",
    options: [
      { label: "No", points: 1 },
      { label: "Yes (no shame)", points: 2 },
    ],
  },
];

const RISK_INFO: Record<RiskLevel, { label: string; interval: string; color: string }> = {
  low: { label: "Chill vibes", interval: "yearly", color: "#10B981" },
  moderate: { label: "Stay sharp", interval: "every 6 months", color: "#F59E0B" },
  high: { label: "Keep it tight", interval: "every 3 months", color: "#EF4444" },
};

function calculateRiskLevel(answers: Record<string, number>): RiskLevel {
  const total = Object.values(answers).reduce((sum, pts) => sum + pts, 0);
  if (total <= 5) return "low";
  if (total <= 7) return "moderate";
  return "high";
}

export default function Onboarding() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { profile, refetch } = useProfile();

  const [showWelcome, setShowWelcome] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Input refs for auto-focus
  const lastNameRef = useRef<TextInput>(null);
  const aliasRef = useRef<TextInput>(null);
  const onboardingStartTime = useRef(Date.now());

  // Step 1: Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [alias, setAlias] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pronouns, setPronouns] = useState("");

  // Step 2: Known conditions + management methods
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [conditionMethods, setConditionMethods] = useState<Record<string, string[]>>({});
  const [noConditions, setNoConditions] = useState(false);

  // Step 3: Risk assessment
  const [riskStep, setRiskStep] = useState(0);
  const [riskAnswers, setRiskAnswers] = useState<Record<string, number>>({});
  const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);

  const totalSteps = 4;

  const validateStep1 = () => {
    if (!firstName.trim()) {
      Alert.alert("Required", "Please enter your first name");
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert("Required", "Please enter your last name");
      return false;
    }
    if (!alias.trim()) {
      Alert.alert("Required", "Please choose an alias");
      return false;
    }
    if (!dob) {
      Alert.alert("Required", "Please select your date of birth");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 2) {
      // Handle back within risk assessment
      if (riskLevel) {
        // On result screen - reset and stay on step 2
        resetRiskAssessment();
        return;
      }
      if (riskStep > 0) {
        // Go to previous question
        setRiskStep(riskStep - 1);
        return;
      }
    }
    if (step > 1) {
      if (step === 3) resetRiskAssessment(); // Reset when going back from conditions
      setStep(step - 1);
    }
  };

  const toggleCondition = (condition: string) => {
    setNoConditions(false);
    setSelectedConditions((prev) => {
      if (prev.includes(condition)) {
        // Remove methods for this condition
        setConditionMethods((m) => {
          const copy = { ...m };
          delete copy[condition];
          return copy;
        });
        return prev.filter((c) => c !== condition);
      }
      return [...prev, condition];
    });
  };

  const toggleMethod = (condition: string, methodId: string) => {
    setConditionMethods((prev) => {
      const current = prev[condition] || [];
      const updated = current.includes(methodId)
        ? current.filter((m) => m !== methodId)
        : [...current, methodId];
      return { ...prev, [condition]: updated };
    });
  };

  const handleNoConditions = () => {
    setNoConditions(true);
    setSelectedConditions([]);
    setConditionMethods({});
  };

  const handleRiskAnswer = (questionId: string, points: number) => {
    const newAnswers = { ...riskAnswers, [questionId]: points };
    setRiskAnswers(newAnswers);

    if (riskStep < RISK_QUESTIONS.length - 1) {
      setRiskStep(riskStep + 1);
    } else {
      setRiskLevel(calculateRiskLevel(newAnswers));
    }
  };

  const resetRiskAssessment = () => {
    setRiskStep(0);
    setRiskAnswers({});
    setRiskLevel(null);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build known conditions array with management methods
      const knownConditions: KnownCondition[] = selectedConditions.map((c) => ({
        condition: c,
        added_at: new Date().toISOString(),
        management_methods: conditionMethods[c]?.length ? conditionMethods[c] : undefined,
      }));

      // Format DOB as YYYY-MM-DD for database
      const formattedDob = dob ? toDateString(dob) : null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from("profiles") as any)
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          alias: alias.trim(),
          date_of_birth: formattedDob,
          pronouns: pronouns || null,
          known_conditions: knownConditions,
          risk_level: riskLevel,
          risk_assessed_at: riskLevel ? new Date().toISOString() : null,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Alias Taken", "This alias is already in use. Please choose another.");
          setStep(1);
          return;
        }
        throw error;
      }

      // Fire-and-forget welcome email (don't block navigation)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          fetch(`${SHARE_BASE_URL}/api/welcome-email`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).catch(() => {});
        }
      });

      await refetch();

      // Derive auth method from Supabase provider (user already fetched above)
      const provider = user?.app_metadata?.provider;
      const authMethod = provider === "apple" ? "apple" : provider === "google" ? "google" : "magic_link";
      trackOnboardingCompleted({
        duration_seconds: Math.round((Date.now() - onboardingStartTime.current) / 1000),
        auth_method: authMethod,
      });

      router.replace("/dashboard");
    } catch (error) {
      Alert.alert(
        "Couldn't Save Profile",
        error instanceof Error ? error.message : "We couldn't save your profile. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const textColor = isDark ? "text-dark-text" : "text-text";
  const textSecondary = isDark ? "text-dark-text-secondary" : "text-text-light";
  const inputBg = isDark ? "bg-dark-surface" : "bg-white";
  const inputBorder = isDark ? "border-dark-border" : "border-gray-200";

  if (showWelcome) {
    return (
      <WelcomeScreens
        isDark={isDark}
        onComplete={() => setShowWelcome(false)}
      />
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-dark-base" : "bg-background"}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Progress */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row gap-2">
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s <= step
                    ? isDark ? "bg-dark-accent" : "bg-primary"
                    : isDark ? "bg-dark-surface-light" : "bg-gray-200"
                }`}
              />
            ))}
          </View>
          <Text className={`text-sm mt-2 ${textSecondary}`}>
            Step {step} of {totalSteps}
          </Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <View className="py-4">
              <View className="items-center mb-6">
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light"}`}>
                  <User size={32} color={isDark ? "#FF2D7A" : "#923D5C"} />
                </View>
                <Text className={`text-2xl font-inter-bold text-center ${textColor}`}>
                  Let's get to know you
                </Text>
                <Text className={`text-center mt-2 px-4 ${textSecondary}`}>
                  Use your legal name as it appears on your health card or ID. This helps us verify that lab results belong to you.
                </Text>
                <View className={`mt-3 px-4 py-3 rounded-xl ${isDark ? "bg-dark-surface" : "bg-gray-50"}`}>
                  <Text className={`text-xs text-center ${isDark ? "text-dark-text-muted" : "text-gray-600"}`}>
                    🔒 Your real name is never shared without your permission
                  </Text>
                </View>
              </View>

              <View className="gap-4">
                <View>
                  <Text className={`text-sm font-inter-semibold mb-2 ${textColor}`}>
                    Legal First Name <Text className="text-danger">*</Text>
                  </Text>
                  <Text className={`text-xs mb-2 ${textSecondary}`}>
                    As it appears on your health card or ID
                  </Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter your legal first name"
                    placeholderTextColor={isDark ? "#6B6B6B" : "#9CA3AF"}
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    blurOnSubmit={false}
                    className={`px-4 py-3 rounded-xl border ${inputBg} ${inputBorder} ${textColor}`}
                  />
                </View>

                <View>
                  <Text className={`text-sm font-inter-semibold mb-2 ${textColor}`}>
                    Legal Last Name <Text className="text-danger">*</Text>
                  </Text>
                  <Text className={`text-xs mb-2 ${textSecondary}`}>
                    As it appears on your health card or ID
                  </Text>
                  <TextInput
                    ref={lastNameRef}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter your legal last name"
                    placeholderTextColor={isDark ? "#6B6B6B" : "#9CA3AF"}
                    returnKeyType="next"
                    onSubmitEditing={() => aliasRef.current?.focus()}
                    blurOnSubmit={false}
                    className={`px-4 py-3 rounded-xl border ${inputBg} ${inputBorder} ${textColor}`}
                  />
                </View>

                <View>
                  <Text className={`text-sm font-inter-semibold mb-2 ${textColor}`}>
                    Alias <Text className="text-danger">*</Text>
                  </Text>
                  <Text className={`text-xs mb-2 ${textSecondary}`}>
                    When sharing, you can show your real name, this alias, or stay anonymous
                  </Text>
                  <TextInput
                    ref={aliasRef}
                    value={alias}
                    onChangeText={setAlias}
                    placeholder="Choose a display name"
                    placeholderTextColor={isDark ? "#6B6B6B" : "#9CA3AF"}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={() => setShowDatePicker(true)}
                    className={`px-4 py-3 rounded-xl border ${inputBg} ${inputBorder} ${textColor}`}
                  />
                </View>

                <View>
                  <Text className={`text-sm font-inter-semibold mb-2 ${textColor}`}>
                    Date of Birth <Text className="text-danger">*</Text>
                  </Text>
                  <Text className={`text-xs mb-2 ${textSecondary}`}>
                    Required for document verification. Labs include DOB on test results to confirm patient identity.
                  </Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className={`px-4 py-3 rounded-xl border flex-row items-center justify-between ${inputBg} ${inputBorder}`}
                  >
                    <Text className={dob ? textColor : (isDark ? "text-[#6B6B6B]" : "text-[#9CA3AF]")}>
                      {dob
                        ? dob.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                        : "Select your date of birth"}
                    </Text>
                    <Calendar size={20} color={isDark ? "#6B6B6B" : "#9CA3AF"} />
                  </Pressable>

                  {/* Date Picker Modal for iOS / Direct picker for Android */}
                  {Platform.OS === "ios" ? (
                    <Modal
                      visible={showDatePicker}
                      transparent
                      animationType="slide"
                    >
                      <Pressable
                        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <View className={`rounded-t-3xl ${isDark ? "bg-dark-surface" : "bg-white"}`}>
                          <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                            <Pressable onPress={() => setShowDatePicker(false)}>
                              <Text className={isDark ? "text-dark-accent" : "text-primary"}>Cancel</Text>
                            </Pressable>
                            <Text className={`font-inter-semibold ${textColor}`}>Date of Birth</Text>
                            <Pressable onPress={() => setShowDatePicker(false)}>
                              <Text className={`font-inter-semibold ${isDark ? "text-dark-accent" : "text-primary"}`}>Done</Text>
                            </Pressable>
                          </View>
                          <DateTimePicker
                            value={dob || new Date(2000, 0, 1)}
                            mode="date"
                            display="spinner"
                            maximumDate={new Date()}
                            minimumDate={new Date(1920, 0, 1)}
                            onChange={(_, selectedDate) => {
                              if (selectedDate) setDob(selectedDate);
                            }}
                            style={{ height: 200 }}
                          />
                        </View>
                      </Pressable>
                    </Modal>
                  ) : (
                    showDatePicker && (
                      <DateTimePicker
                        value={dob || new Date(2000, 0, 1)}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        minimumDate={new Date(1920, 0, 1)}
                        onChange={(_, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) setDob(selectedDate);
                        }}
                      />
                    )
                  )}
                </View>

                <View>
                  <Text className={`text-sm font-inter-semibold mb-2 ${textColor}`}>
                    Pronouns <Text className={textSecondary}>(optional)</Text>
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {PRONOUNS_OPTIONS.map((p) => {
                      const isOther = p === "other";
                      const isSelected = isOther
                        ? pronouns !== "" && !["he/him", "she/her", "they/them"].includes(pronouns)
                        : pronouns === p;
                      return (
                        <Pressable
                          key={p}
                          onPress={() => setPronouns(isSelected && !isOther ? "" : (isOther ? "other" : p))}
                          className={`px-4 py-2 rounded-full border ${
                            isSelected
                              ? isDark ? "bg-dark-accent border-dark-accent" : "bg-primary border-primary"
                              : `${inputBg} ${inputBorder}`
                          }`}
                        >
                          <Text className={isSelected ? "text-white font-inter-semibold" : textColor}>
                            {p}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {pronouns !== "" && !["he/him", "she/her", "they/them", ""].includes(pronouns) && (
                    <TextInput
                      value={pronouns === "other" ? "" : pronouns}
                      onChangeText={setPronouns}
                      placeholder="Enter your pronouns"
                      placeholderTextColor={isDark ? "#6B6B6B" : "#9CA3AF"}
                      autoCapitalize="none"
                      className={`mt-3 px-4 py-3 rounded-xl border ${inputBg} ${inputBorder} ${textColor}`}
                    />
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Risk Assessment */}
          {step === 2 && (
            <View className="py-4">
              <View className="items-center mb-6">
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? "bg-dark-success-bg" : "bg-green-100"}`}>
                  <Activity size={32} color={isDark ? "#00E5A0" : "#10B981"} />
                </View>
                <Text className={`text-2xl font-inter-bold text-center ${textColor}`}>
                  {riskLevel ? "Your vibe" : "Quick check-in"}
                </Text>
                <Text className={`text-center mt-2 px-4 ${textSecondary}`}>
                  {riskLevel
                    ? "We'll remind you when it's time to test."
                    : "A few questions to personalize your testing schedule."}
                </Text>
              </View>

              {!riskLevel ? (
                <>
                  {/* Risk question progress */}
                  <View className="flex-row gap-1 mb-6">
                    {RISK_QUESTIONS.map((_, i) => (
                      <View
                        key={i}
                        className={`flex-1 h-1 rounded-full ${
                          i <= riskStep
                            ? isDark ? "bg-dark-success" : "bg-green-500"
                            : isDark ? "bg-dark-surface-light" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </View>

                  <Text className={`text-xl font-inter-semibold mb-6 ${textColor}`}>
                    {RISK_QUESTIONS[riskStep].question}
                  </Text>

                  <View className="gap-3">
                    {RISK_QUESTIONS[riskStep].options.map((opt) => (
                      <Pressable
                        key={opt.label}
                        onPress={() => handleRiskAnswer(RISK_QUESTIONS[riskStep].id, opt.points)}
                        className={`p-4 rounded-xl border flex-row items-center justify-between ${inputBg} ${inputBorder}`}
                      >
                        <Text className={`font-inter-medium ${textColor}`}>{opt.label}</Text>
                        <ChevronRight size={20} color={isDark ? "#6B6B6B" : "#9CA3AF"} />
                      </Pressable>
                    ))}
                  </View>

                  <Text className={`text-xs text-center mt-6 ${textSecondary}`}>
                    Based on CDC guidelines. No judgment, just smart reminders.
                  </Text>
                </>
              ) : (
                <>
                  {/* Risk result */}
                  <View className="items-center">
                    <View
                      className="w-20 h-20 rounded-full items-center justify-center mb-4"
                      style={{ backgroundColor: RISK_INFO[riskLevel].color + "20" }}
                    >
                      <Text className="text-3xl">
                        {riskLevel === "low" ? "✓" : riskLevel === "moderate" ? "!" : "!!"}
                      </Text>
                    </View>

                    <Text
                      className="text-2xl font-inter-bold mb-2"
                      style={{ color: RISK_INFO[riskLevel].color }}
                    >
                      {RISK_INFO[riskLevel].label}
                    </Text>

                    <Text className={`text-center mb-6 ${textSecondary}`}>
                      Testing {RISK_INFO[riskLevel].interval} keeps you in the clear.
                    </Text>

                    <Pressable onPress={resetRiskAssessment}>
                      <Text className={`font-inter-medium ${isDark ? "text-dark-accent" : "text-primary"}`}>
                        Retake assessment
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Step 3: Known Conditions */}
          {step === 3 && (
            <View className="py-4">
              <View className="items-center mb-6">
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? "bg-dark-lavender/20" : "bg-purple-100"}`}>
                  <Heart size={32} color={isDark ? "#C9A0DC" : "#7C3AED"} />
                </View>
                <Text className={`text-2xl font-inter-bold text-center ${textColor}`}>
                  Any conditions we should know?
                </Text>
                <Text className={`text-center mt-2 px-4 ${textSecondary}`}>
                  Some STIs stay with you for life. Knowing this helps us show your status accurately and avoid false alerts.
                </Text>
              </View>

              <View className="gap-3">
                {STATUS_STIS.map((condition) => {
                  const isSelected = selectedConditions.includes(condition);
                  const applicableMethods = getMethodsForCondition(condition);
                  const methods = conditionMethods[condition] || [];
                  return (
                    <View key={condition}>
                      <Pressable
                        onPress={() => toggleCondition(condition)}
                        className={`p-4 rounded-xl border ${
                          isSelected
                            ? isDark ? "bg-dark-lavender/20 border-dark-lavender" : "bg-purple-50 border-purple-400"
                            : `${inputBg} ${inputBorder}`
                        } ${isSelected && applicableMethods.length > 0 ? "rounded-b-none" : ""}`}
                      >
                        <Text className={`font-inter-semibold ${
                          isSelected
                            ? isDark ? "text-dark-lavender" : "text-purple-700"
                            : textColor
                        }`}>
                          {condition}
                        </Text>
                      </Pressable>
                      {isSelected && applicableMethods.length > 0 && (
                        <View
                          className={`px-4 pb-3 pt-2 border border-t-0 rounded-b-xl ${
                            isDark ? "bg-dark-lavender/10 border-dark-lavender" : "bg-purple-50/50 border-purple-400"
                          }`}
                        >
                          <Text className={`text-xs font-inter-medium mb-2 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
                            How do you manage this?
                          </Text>
                          <View className="flex-row flex-wrap gap-2">
                            {applicableMethods.map((method) => {
                              const selected = methods.includes(method.id);
                              return (
                                <Pressable
                                  key={method.id}
                                  onPress={() => toggleMethod(condition, method.id)}
                                  className={`px-3 py-1.5 rounded-full ${
                                    selected
                                      ? isDark ? "bg-dark-lavender/20" : "bg-purple-100"
                                      : isDark ? "bg-dark-surface-light" : "bg-gray-100"
                                  }`}
                                  accessibilityLabel={`${method.label}, ${selected ? "selected" : "not selected"}`}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: selected }}
                                >
                                  <Text
                                    className={`text-xs font-inter-medium ${
                                      selected
                                        ? isDark ? "text-dark-lavender" : "text-purple-700"
                                        : isDark ? "text-dark-text-muted" : "text-text-light"
                                    }`}
                                  >
                                    {method.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}

                <View className="h-px bg-gray-200 dark:bg-dark-border my-2" />

                <Pressable
                  onPress={handleNoConditions}
                  className={`p-4 rounded-xl border ${
                    noConditions
                      ? isDark ? "bg-dark-success-bg border-dark-success" : "bg-success-light border-success"
                      : `${inputBg} ${inputBorder}`
                  }`}
                >
                  <Text className={`font-inter-semibold ${
                    noConditions
                      ? isDark ? "text-dark-success" : "text-success-dark"
                      : textColor
                  }`}>
                    I don't have any of these
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setNoConditions(false);
                    setSelectedConditions([]);
                    setConditionMethods({});
                  }}
                  className={`p-4 rounded-xl border ${
                    !noConditions && selectedConditions.length === 0
                      ? isDark ? "bg-dark-surface-light border-dark-border" : "bg-gray-100 border-gray-300"
                      : `${inputBg} ${inputBorder}`
                  }`}
                >
                  <Text className={textColor}>I'm not sure / prefer not to say</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <View className="py-4">
              <View className="items-center mb-6">
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? "bg-dark-accent-muted" : "bg-primary-light"}`}>
                  <Calendar size={32} color={isDark ? "#FF2D7A" : "#923D5C"} />
                </View>
                <Text className={`text-2xl font-inter-bold text-center ${textColor}`}>
                  You're all set!
                </Text>
                <Text className={`text-center mt-2 px-4 ${textSecondary}`}>
                  Regular testing is key to staying on top of your sexual health.
                </Text>
              </View>

              <Card className="mt-4">
                <Text className={`font-inter-semibold mb-2 ${textColor}`}>
                  Quick summary
                </Text>
                <View className="gap-1">
                  <Text className={textSecondary}>
                    Name: {firstName} {lastName}
                  </Text>
                  <Text className={textSecondary}>
                    Alias: {alias}
                  </Text>
                  {selectedConditions.length > 0 && (
                    <Text className={textSecondary}>
                      Managed conditions: {selectedConditions.join(", ")}
                    </Text>
                  )}
                  {riskLevel && (
                    <Text className={textSecondary}>
                      Testing frequency: {RISK_INFO[riskLevel].interval}
                    </Text>
                  )}
                </View>
              </Card>
            </View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Navigation */}
        <View className={`px-6 py-4 border-t ${isDark ? "border-dark-border bg-dark-base" : "border-gray-200 bg-background"}`}>
          <View className="flex-row gap-3">
            {(step > 1 || (step === 2 && riskStep > 0)) && (
              <Pressable
                onPress={handleBack}
                className={`flex-row items-center justify-center px-6 py-3 rounded-xl border ${inputBorder}`}
              >
                <ChevronLeft size={20} color={isDark ? "#fff" : "#2D2438"} />
                <Text className={`ml-1 font-inter-semibold ${textColor}`}>Back</Text>
              </Pressable>
            )}
            {/* Hide Continue button while answering risk questions (step 2 without result) */}
            {!(step === 2 && !riskLevel) && (
              <Button
                onPress={step === totalSteps ? handleComplete : handleNext}
                disabled={loading}
                className="flex-1"
                label={loading ? "Saving..." : step === totalSteps ? "Get Started" : "Continue"}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
