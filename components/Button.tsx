import { Pressable, Text, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-2xl py-4 px-6 shadow-sm active:opacity-80",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        secondary: "bg-primary-light/50 border border-primary-light",
        outline: "bg-transparent border border-border",
        ghost: "bg-transparent",
        danger: "bg-danger",
      },
      size: {
        default: "h-14",
        sm: "h-10 px-4 py-2 rounded-xl",
        lg: "h-16 px-8 rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const buttonTextVariants = cva("font-inter-semibold text-center", {
  variants: {
    variant: {
      primary: "text-white",
      secondary: "text-primary",
      outline: "text-text",
      ghost: "text-primary",
      danger: "text-white",
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
    VariantProps<typeof buttonVariants> {
  label: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant,
  size,
  className,
  textClassName,
  icon,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text
        className={cn(buttonTextVariants({ variant, size }), textClassName)}
      >
        {label}
      </Text>
    </Pressable>
  );
}
