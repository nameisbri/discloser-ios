import { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChevronRight } from "lucide-react-native";
import { Button } from "./Button";
import { supabase } from "../lib/supabase";
import type { RiskLevel } from "../lib/types";

interface RiskAssessmentProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (level: RiskLevel) => void;
}

const QUESTIONS = [
  {
    id: "partners",
    question: "How many sexual partners have you had in the last 12 months?",
    options: [
      { label: "0-1", points: 1 },
      { label: "2-5", points: 2 },
      { label: "6 or more", points: 3 },
    ],
  },
  {
    id: "protection",
    question: "How often do you use protection (condoms, dental dams)?",
    options: [
      { label: "Always", points: 1 },
      { label: "Sometimes", points: 2 },
      { label: "Rarely or never", points: 3 },
    ],
  },
  {
    id: "status",
    question: "Do any of your partners have unknown STI status?",
    options: [
      { label: "No", points: 1 },
      { label: "Yes or unsure", points: 2 },
    ],
  },
  {
    id: "history",
    question: "Have you had an STI in the past 2 years?",
    options: [
      { label: "No", points: 1 },
      { label: "Yes", points: 2 },
    ],
  },
];

function calculateRiskLevel(answers: Record<string, number>): RiskLevel {
  const total = Object.values(answers).reduce((sum, pts) => sum + pts, 0);
  if (total <= 5) return "low";
  if (total <= 7) return "moderate";
  return "high";
}

const RISK_INFO: Record<RiskLevel, { label: string; interval: string; color: string }> = {
  low: { label: "Low Risk", interval: "every 12 months", color: "#10B981" },
  moderate: { label: "Moderate Risk", interval: "every 6 months", color: "#F59E0B" },
  high: { label: "High Risk", interval: "every 3 months", color: "#EF4444" },
};

export function RiskAssessment({ visible, onClose, onComplete }: RiskAssessmentProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<RiskLevel | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAnswer = (questionId: string, points: number) => {
    const newAnswers = { ...answers, [questionId]: points };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setResult(calculateRiskLevel(newAnswers));
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        risk_level: result,
        risk_assessed_at: new Date().toISOString(),
      }).eq("id", user.id);
    }

    setSaving(false);
    onComplete(result);
    handleClose();
  };

  const handleClose = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
    onClose();
  };

  if (!visible) return null;

  const currentQuestion = QUESTIONS[step];
  const info = result ? RISK_INFO[result] : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F2937" }}>
            {result ? "Your Risk Level" : "Risk Assessment"}
          </Text>
          <Pressable onPress={handleClose} style={{ padding: 8 }}>
            <X size={24} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1, padding: 20 }}>
          {!result ? (
            <>
              {/* Progress */}
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 24 }}>
                {QUESTIONS.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: i <= step ? "#923D5C" : "#E5E7EB",
                    }}
                  />
                ))}
              </View>

              {/* Question */}
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#1F2937", marginBottom: 24 }}>
                {currentQuestion.question}
              </Text>

              {/* Options */}
              <View style={{ gap: 12 }}>
                {currentQuestion.options.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => handleAnswer(currentQuestion.id, opt.points)}
                    style={{
                      backgroundColor: "#fff",
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 16, color: "#1F2937" }}>{opt.label}</Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </Pressable>
                ))}
              </View>

              <Text style={{ marginTop: 24, fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
                This assessment is based on CDC guidelines and helps personalize your testing reminders.
              </Text>
            </>
          ) : (
            <>
              {/* Result */}
              <View style={{ alignItems: "center", marginTop: 20 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: info!.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 32 }}>
                    {result === "low" ? "✓" : result === "moderate" ? "!" : "!!"}
                  </Text>
                </View>

                <Text style={{ fontSize: 24, fontWeight: "700", color: info!.color, marginBottom: 8 }}>
                  {info!.label}
                </Text>

                <Text style={{ fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
                  Based on your answers, we recommend testing {info!.interval}.
                </Text>

                <View style={{ backgroundColor: "#F3F4F6", padding: 16, borderRadius: 12, width: "100%" }}>
                  <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
                    We'll use this to suggest testing dates and send you timely reminders.
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 32 }}>
                <Button label={saving ? "Saving..." : "Save & Continue"} onPress={handleSave} disabled={saving} />
                <Pressable onPress={() => { setStep(0); setAnswers({}); setResult(null); }} style={{ padding: 16 }}>
                  <Text style={{ textAlign: "center", color: "#923D5C", fontWeight: "600" }}>Retake Assessment</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
