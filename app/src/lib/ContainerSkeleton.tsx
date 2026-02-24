import { Skeleton } from "@/components/ui/skeleton";

type SlotShape = "header" | "sidebar" | "main" | "footer";

const shapeStyles: Record<SlotShape, string> = {
  header: "h-16 w-full",
  sidebar: "h-full w-full min-h-[200px]",
  main: "h-full w-full min-h-[400px]",
  footer: "h-14 w-full",
};

export function ContainerSkeleton({ shape }: { shape: SlotShape }) {
  return (
    <div className="animate-pulse">
      <Skeleton className={shapeStyles[shape]} />
    </div>
  );
}
