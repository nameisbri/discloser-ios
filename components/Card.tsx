import { View, type ViewProps } from "react-native";
import { cn } from "../lib/utils";
import { useTheme } from "../context/theme";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  /**
   * When true, the card is not focusable by assistive technology
   * Use when card contains interactive children
   * @default true
   */
  accessibilityElementsHidden?: boolean;
}

export function Card({
  children,
  className,
  accessibilityElementsHidden = false,
  ...props
}: CardProps) {
  const { isDark } = useTheme();

  return (
    <View
      className={cn(
        "rounded-2xl p-5 border",
        isDark
          ? "bg-dark-surface border-dark-border"
          : "bg-background-card border-border",
        className
      )}
      // Don't make the card itself accessible if it contains interactive children
      accessible={!accessibilityElementsHidden}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <View className={cn("mb-4", className)} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ children, className, ...props }: CardProps) {
  return (
    <View className={cn("", className)} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className, ...props }: CardProps) {
  const { isDark } = useTheme();

  return (
    <View
      className={cn(
        "mt-6 pt-4 border-t",
        isDark ? "border-dark-border" : "border-border",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
