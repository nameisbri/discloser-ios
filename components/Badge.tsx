import { View, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { useTheme } from "../context/theme";

const badgeVariantsLight = cva(
  "px-3 py-1 rounded-full items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-primary-light/50",
        success: "bg-success-light",
        danger: "bg-danger-light",
        warning: "bg-warning-light",
        outline: "bg-transparent border border-border",
        info: "bg-purple-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const badgeVariantsDark = cva(
  "px-3 py-1 rounded-full items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-dark-accent-muted",
        success: "bg-dark-success-bg",
        danger: "bg-dark-danger-bg",
        warning: "bg-dark-warning-bg",
        outline: "bg-transparent border border-dark-border",
        info: "bg-dark-lavender/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const badgeTextVariantsLight = cva(
  "text-xs font-inter-bold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "text-primary",
        success: "text-success",
        danger: "text-danger",
        warning: "text-warning",
        outline: "text-text-light",
        info: "text-purple-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const badgeTextVariantsDark = cva(
  "text-xs font-inter-bold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "text-dark-accent",
        success: "text-dark-success",
        danger: "text-dark-danger",
        warning: "text-dark-warning",
        outline: "text-dark-text-secondary",
        info: "text-dark-lavender",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariantsLight> {
  label: string;
  className?: string;
  textClassName?: string;
  /**
   * Custom accessibility label (defaults to label prop)
   */
  accessibilityLabel?: string;
}

export function Badge({
  label,
  variant,
  className,
  textClassName,
  accessibilityLabel,
}: BadgeProps) {
  const { isDark } = useTheme();

  const badgeVariants = isDark ? badgeVariantsDark : badgeVariantsLight;
  const textVariants = isDark ? badgeTextVariantsDark : badgeTextVariantsLight;

  return (
    <View
      className={cn(badgeVariants({ variant }), className)}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `${label} status`}
    >
      <Text className={cn(textVariants({ variant }), textClassName)}>
        {label}
      </Text>
    </View>
  );
}
