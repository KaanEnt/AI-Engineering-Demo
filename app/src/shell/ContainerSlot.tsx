"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { ContainerSkeleton } from "@/lib/ContainerSkeleton";

type SlotShape = "header" | "sidebar" | "main" | "footer";

interface ContainerSlotProps {
  name: SlotShape;
  children: React.ReactNode;
}

export function ContainerSlot({ name, children }: ContainerSlotProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ContainerSkeleton shape={name} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
