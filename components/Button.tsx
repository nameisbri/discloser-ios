import { Pressable, Text, View, Animated } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { useTheme } from "../context/theme";
import { hapticImpact } from "../lib/utils/haptics";
import { useReducedMotion, usePressAnimation, usePulseAnimation } from "../lib/utils/animations";

// Light mode variants
const buttonVariantsLight = cva(
  "flex-row items-center justify-center rounded-2xl py-4 px-6",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        secondary: "bg-primary-muted border-2 border-primary/20",
        outline: "bg-background-card border-2 border-border",
        ghost: "bg-transparent",
        danger: "bg-danger",
        accent: "bg-accent",
      },
      size: {
        default: "h-14",
        sm: "h-11 px-4 py-2 rounded-xl",
        lg: "h-16 px-8 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

// Dark mode variants
const buttonVariantsDark = cva(
  "flex-row items-center justify-center rounded-2xl py-4 px-6",
  {
    variants: {
      variant: {
        primary: "bg-dark-accent",
        secondary: "bg-dark-accent-muted border-2 border-dark-accent/30",
        outline: "bg-dark-surface border-2 border-dark-border",
        ghost: "bg-transparent",
        danger: "bg-danger",
        accent: "bg-dark-coral",
      },
      size: {
        default: "h-14",
        sm: "h-11 px-4 py-2 rounded-xl",
        lg: "h-16 px-8 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const buttonTextVariantsLight = cva("font-inter-bold text-center", {
  variants: {
    variant: {
      primary: "text-white",
      secondary: "text-primary",
      outline: "text-text",
      ghost: "text-primary",
      danger: "text-white",
      accent: "text-white",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

const buttonTextVariantsDark = cva("font-inter-bold text-center", {
  variants: {
    variant: {
      primary: "text-white",
      secondary: "text-dark-accent",
      outline: "text-dark-text",
      ghost: "text-dark-accent",
      danger: "text-white",
      accent: "text-white",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariantsLight> {
  label: string;
  textClassName?: string;
  icon?: React.ReactNode;
  /**
   * Custom accessibility label (defaults to label prop)
   */
  accessibilityLabel?: string;
  /**
   * Optional hint describing what happens on press
   */
  accessibilityHint?: string;
  /**
   * Disable haptic feedback
   */
  hapticDisabled?: boolean;
  /**
   * Show loading state with pulse animation
   */
  loading?: boolean;
}

export function Button({
  label,
  variant,
  size,
  className,
  textClassName,
  icon,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  hapticDisabled,
  loading,
  onPress,
  ...props
}: ButtonProps & { disabled?: boolean }) {
  const { isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const { scale, handlePressIn, handlePressOut } = usePressAnimation(reduceMotion);
  const pulseOpacity = usePulseAnimation(reduceMotion, loading || false);

  const buttonVariants = isDark ? buttonVariantsDark : buttonVariantsLight;
  const textVariants = isDark ? buttonTextVariantsDark : buttonTextVariantsLight;

  const handlePress = async (event: any) => {
    if (disabled || loading) return;

    // Trigger haptic feedback - heavy for danger variant
    if (!hapticDisabled) {
      await hapticImpact(variant === "danger" ? "heavy" : "medium");
    }

    onPress?.(event);
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        loading ? { opacity: pulseOpacity } : undefined,
      ]}
    >
      <Pressable
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        style={disabled ? { opacity: 0.5 } : undefined}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading || false }}
        {...props}
      >
        {icon && <View className="mr-2">{icon}</View>}
        <Text
          className={cn(textVariants({ variant, size }), textClassName)}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
