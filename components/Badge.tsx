import { View, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "px-3 py-1 rounded-full items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-primary-light/50",
        success: "bg-success-light",
        danger: "bg-danger-light",
        warning: "bg-warning-light",
        outline: "bg-transparent border border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const badgeTextVariants = cva(
  "text-xs font-inter-bold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "text-primary",
        success: "text-success",
        danger: "text-danger",
        warning: "text-warning",
        outline: "text-text-light",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  className?: string;
  textClassName?: string;
}

export function Badge({
  label,
  variant,
  className,
  textClassName,
}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={cn(badgeTextVariants({ variant }), textClassName)}>
        {label}
      </Text>
    </View>
  );
}
