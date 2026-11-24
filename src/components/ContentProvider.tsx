"use client";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { parseSnapshot, type Content, type Snapshot } from "@/lib/content";

const Context = createContext<Content | null>(null);
export function ContentProvider({
  initial,
  endpoint,
  children,
}: {
  initial: Snapshot;
  endpoint: string;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  useEffect(
    function watchPublishedContent() {
      let stopped = false;
      let running = false;
      let etag = `"${initial.digest}"`;
      let controller: AbortController | undefined;
      async function refresh() {
        if (stopped || running || document.visibilityState !== "visible")
          return;
        running = true;
        controller = new AbortController();
        const timeout = setTimeout(() => controller?.abort(), 10000);
        try {
          const response = await fetch(endpoint, {
            credentials: "omit",
            cache: "no-cache",
            headers: { "If-None-Match": etag },
            signal: controller.signal,
          });
          if (response.status === 304 || !response.ok) return;
          const next = parseSnapshot(await response.json());
          if (!next || stopped) return;
          etag = `"${next.digest}"`;
          startTransition(() =>
            setSnapshot((previous) =>
              previous.digest === next.digest ? previous : next,
            ),
          );
        } catch {
          /* Keep the last valid snapshot; retry on the next interval. */
        } finally {
          clearTimeout(timeout);
          running = false;
        }
      }
      void refresh();
      const timer = setInterval(() => void refresh(), 5000);
      document.addEventListener("visibilitychange", refresh);
      window.addEventListener("focus", refresh);
      window.addEventListener("online", refresh);
      return () => {
        stopped = true;
        controller?.abort();
        clearInterval(timer);
        document.removeEventListener("visibilitychange", refresh);
        window.removeEventListener("focus", refresh);
        window.removeEventListener("online", refresh);
      };
    },
    [endpoint, initial.digest],
  );
  return <Context.Provider value={snapshot.data}>{children}</Context.Provider>;
}
export function useContent() {
  const value = useContext(Context);
  if (!value) throw new Error("ContentProvider ausente.");
  return value;
}
