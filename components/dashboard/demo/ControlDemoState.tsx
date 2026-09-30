"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ControlDemoDecision = "waiting" | "approved" | "declined";

type ControlDemoState = {
  decision: ControlDemoDecision;
  notice: string;
  approve: () => void;
  decline: () => void;
  reset: () => void;
};

const ControlDemoStateContext = createContext<ControlDemoState | null>(null);

export function ControlDemoStateProvider({ children }: { children: ReactNode }) {
  const [decision, setDecision] = useState<ControlDemoDecision>("waiting");
  const [notice, setNotice] = useState("Waiting for review.");

  const decide = (next: Exclude<ControlDemoDecision, "waiting">) => {
    setDecision(next);
    setNotice(`Example marked ${next} in this tab. No tool call was run.`);
  };

  const reset = () => {
    setDecision("waiting");
    setNotice("Example reset to waiting for review.");
  };

  return (
    <ControlDemoStateContext.Provider
      value={{
        decision,
        notice,
        approve: () => decide("approved"),
        decline: () => decide("declined"),
        reset,
      }}
    >
      {children}
    </ControlDemoStateContext.Provider>
  );
}

export function useControlDemoState() {
  const state = useContext(ControlDemoStateContext);
  if (!state) {
    throw new Error("Control demo state must be used inside its route provider.");
  }
  return state;
}
