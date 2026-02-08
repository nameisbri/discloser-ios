export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const statusColor = (s: string, isKnown?: boolean) =>
  isKnown
    ? "text-accent-lavender"
    : s === "negative"
      ? "text-accent-mint"
      : s === "positive"
        ? "text-danger"
        : "text-warning";

export const statusBg = (s: string, isKnown?: boolean) =>
  isKnown
    ? "bg-accent-lavender/20"
    : s === "negative"
      ? "bg-accent-mint/20"
      : s === "positive"
        ? "bg-danger/20"
        : "bg-warning/20";
