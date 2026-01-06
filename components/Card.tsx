import { View, type ViewProps } from "react-native";
import { cn } from "../lib/utils";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "bg-white rounded-3xl p-6 shadow-sm border border-border",
        className
      )}
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
  return (
    <View
      className={cn("mt-6 pt-4 border-t border-border", className)}
      {...props}
    >
      {children}
    </View>
  );
}
