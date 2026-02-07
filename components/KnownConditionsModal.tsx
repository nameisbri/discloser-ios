import { useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator, ScrollView } from "react-native";
import { Check, Plus, X } from "lucide-react-native";
import { STATUS_STIS, type KnownCondition } from "../lib/types";
import { getMethodsForCondition, getMethodLabel } from "../lib/managementMethods";
import { useTheme } from "../context/theme";
import { Button } from "./Button";
import { hapticSelection, hapticNotification } from "../lib/utils/haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
  conditions: KnownCondition[];
  onAdd: (condition: string, notes?: string) => Promise<boolean | void>;
  onRemove: (condition: string) => Promise<boolean | void>;
  onUpdateMethods?: (condition: string, methods: string[]) => Promise<boolean | void>;
}

export function KnownConditionsModal({ visible, onClose, conditions, onAdd, onRemove, onUpdateMethods }: Props) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);

  const isAdded = (condition: string) => conditions.some((c) => c.condition === condition);
  const getMethods = (condition: string) =>
    conditions.find((c) => c.condition === condition)?.management_methods || [];

  const handleToggle = async (condition: string) => {
    setLoading(condition);
    await hapticSelection();
    try {
      const result = isAdded(condition)
        ? await onRemove(condition)
        : await onAdd(condition);

      if (result === true) {
        await hapticNotification("success");
      } else {
        await hapticNotification("error");
      }
    } catch {
      await hapticNotification("error");
    } finally {
      setLoading(null);
    }
  };

  const handleMethodToggle = async (condition: string, methodId: string) => {
    if (!onUpdateMethods) return;
    await hapticSelection();
    const current = getMethods(condition);
    const updated = current.includes(methodId)
      ? current.filter((m) => m !== methodId)
      : [...current, methodId];
    await onUpdateMethods(condition, updated);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`rounded-t-3xl p-6 max-h-[85%] ${isDark ? "bg-dark-surface" : "bg-white"}`}>
          <View className="flex-row justify-between items-center mb-2">
            <Pressable onPress={onClose} className="p-2 -ml-2">
              <X size={24} color={isDark ? "#FFFFFF" : "#374151"} />
            </Pressable>
            <Text className={`text-xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              Managed Conditions
            </Text>
            <View className="w-10" />
          </View>

          <Text className={`text-sm mb-6 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
            Mark conditions you're living with. These won't affect your routine test status.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-3">
              {STATUS_STIS.map((condition) => {
                const added = isAdded(condition);
                const isLoading = loading === condition;
                const methods = getMethods(condition);
                const applicableMethods = getMethodsForCondition(condition);
                return (
                  <View key={condition}>
                    <Pressable
                      onPress={() => handleToggle(condition)}
                      disabled={isLoading}
                      className={`flex-row items-center p-4 rounded-2xl border ${
                        added
                          ? isDark
                            ? "bg-dark-lavender/20 border-dark-lavender/50"
                            : "bg-purple-50 border-purple-200"
                          : isDark
                          ? "bg-dark-surface-light border-dark-border"
                          : "bg-gray-50 border-border"
                      } ${added && applicableMethods.length > 0 ? "rounded-b-none" : ""}`}
                      style={{ opacity: isLoading ? 0.6 : 1 }}
                      accessibilityLabel={`${condition}, ${added ? "selected" : "not selected"}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: added, disabled: isLoading }}
                      accessibilityHint={added ? "Tap to remove from managed conditions" : "Tap to add to managed conditions"}
                    >
                      <Text
                        className={`flex-1 font-inter-medium ${
                          added
                            ? isDark
                              ? "text-dark-lavender"
                              : "text-purple-700"
                            : isDark
                            ? "text-dark-text"
                            : "text-text"
                        }`}
                      >
                        {condition}
                      </Text>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={isDark ? "#C9A0DC" : "#7C3AED"} />
                      ) : added ? (
                        <Check size={20} color={isDark ? "#C9A0DC" : "#7C3AED"} />
                      ) : (
                        <Plus size={20} color={isDark ? "#6B7280" : "#9CA3AF"} />
                      )}
                    </Pressable>

                    {/* Management Methods - shown when condition is added */}
                    {added && applicableMethods.length > 0 && (
                      <View
                        className={`px-4 pb-4 pt-2 border border-t-0 rounded-b-2xl ${
                          isDark ? "bg-dark-lavender/10 border-dark-lavender/50" : "bg-purple-50/50 border-purple-200"
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
                                onPress={() => handleMethodToggle(condition, method.id)}
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
            </View>

            <View className="mt-6">
              <Button label="Done" onPress={onClose} />
            </View>
            <View className="h-4" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
