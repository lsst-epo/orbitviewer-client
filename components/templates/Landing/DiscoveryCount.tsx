"use client";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Locale } from "@/lib/i18n/settings";

const DiscoveryContext = createContext<{
  leaving: boolean;
  setLeaving: Dispatch<SetStateAction<boolean>>;
  count: number | null;
  setCount: Dispatch<SetStateAction<number | null>>;
} | null>(null);

export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const [leaving, setLeaving] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  return (
    <DiscoveryContext value={{ count, setCount, leaving, setLeaving }}>
      {children}
    </DiscoveryContext>
  );
}

export function useDiscoveryCount() {
  const context = useContext(DiscoveryContext);
  if (!context) throw new Error("DiscoveryProvider is missing");
  return context;
}

export function DiscoveryCount({ locale }: { locale: Locale }) {
  const { count } = useDiscoveryCount();
  return (
    <span>
      {count === null ? "—" : new Intl.NumberFormat(locale).format(count)}
    </span>
  );
}

export function LandingSurface({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const { leaving } = useDiscoveryCount();
  return (
    <main className={className} data-leaving={leaving}>
      {children}
    </main>
  );
}
