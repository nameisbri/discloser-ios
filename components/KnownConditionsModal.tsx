import { View, Text, Pressable, Modal } from "react-native";
import { Check, Plus, X } from "lucide-react-native";
import { STATUS_STIS, type KnownCondition } from "../lib/types";
import { useTheme } from "../context/theme";
import { Button } from "./Button";

interface Props {
  visible: boolean;
  onClose: () => void;
  conditions: KnownCondition[];
  onAdd: (condition: string) => Promise<void>;
  onRemove: (condition: string) => Promise<void>;
}

export function KnownConditionsModal({ visible, onClose, conditions, onAdd, onRemove }: Props) {
  const { isDark } = useTheme();

  const isAdded = (condition: string) => conditions.some((c) => c.condition === condition);

  const handleToggle = async (condition: string) => {
    if (isAdded(condition)) {
      await onRemove(condition);
    } else {
      await onAdd(condition);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`rounded-t-3xl p-6 ${isDark ? "bg-dark-surface" : "bg-white"}`}>
          <View className="flex-row justify-between items-center mb-2">
            <Pressable onPress={onClose} className="p-2 -ml-2">
              <X size={24} color={isDark ? "#FFFFFF" : "#374151"} />
            </Pressable>
            <Text className={`text-xl font-inter-bold ${isDark ? "text-dark-text" : "text-secondary-dark"}`}>
              Known Conditions
            </Text>
            <View className="w-10" />
          </View>

          <Text className={`text-sm mb-6 ${isDark ? "text-dark-text-muted" : "text-text-light"}`}>
            Mark conditions you're living with. These won't affect your routine test status.
          </Text>

          <View className="gap-3">
            {STATUS_STIS.map((condition) => {
              const added = isAdded(condition);
              return (
                <Pressable
                  key={condition}
                  onPress={() => handleToggle(condition)}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    added
                      ? isDark
                        ? "bg-dark-lavender/20 border-dark-lavender/50"
                        : "bg-purple-50 border-purple-200"
                      : isDark
                      ? "bg-dark-surface-light border-dark-border"
                      : "bg-gray-50 border-border"
                  }`}
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
                  {added ? (
                    <Check size={20} color={isDark ? "#C9A0DC" : "#7C3AED"} />
                  ) : (
                    <Plus size={20} color={isDark ? "#6B7280" : "#9CA3AF"} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View className="mt-6">
            <Button label="Done" onPress={onClose} />
          </View>
          <View className="h-4" />
        </View>
      </View>
    </Modal>
  );
}
