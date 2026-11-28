import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { useAuth } from "./AuthContext";
import {
  createSchoolDataController,
  type SchoolDataController,
  type SchoolDataState,
} from "./schoolDataController";

export interface SchoolDataContextValue extends SchoolDataState {
  refreshData: () => Promise<boolean>;
  setSelectedStudentId: (studentId: string) => void;
  processPayment: (amount: number) => Promise<void>;
}

const SchoolDataContext = createContext<SchoolDataContextValue | null>(null);

function buildInitialState(isParentSession: boolean): SchoolDataState {
  return {
    students: [],
    fees: [],
    payments: [],
    selectedStudentId: "",
    isLoading: isParentSession,
    isRefreshing: false,
    isProcessingPayment: false,
    error: null,
  };
}

export function SchoolDataProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const { isLoggedIn, userRole, userEmail } = useAuth();
  const isParentSession = isLoggedIn && userRole === "parent";

  const controllerRef = useRef<SchoolDataController | null>(null);
  const [state, setState] = useState<SchoolDataState>(() =>
    buildInitialState(isParentSession),
  );

  useEffect(() => {
    if (!isParentSession) {
      controllerRef.current = null;
      setState(buildInitialState(false));
      return;
    }

    const controller = createSchoolDataController({
      onStateChange: setState,
    });
    controllerRef.current = controller;
    setState(controller.getState());
    const stop = controller.start();

    return () => {
      stop();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [isParentSession, userEmail]);

  const refreshData = useCallback(async (): Promise<boolean> => {
    const controller = controllerRef.current;
    if (!controller) {
      return false;
    }
    return controller.refreshData();
  }, []);

  const setSelectedStudentId = useCallback((studentId: string): void => {
    controllerRef.current?.setSelectedStudentId(studentId);
  }, []);

  const processPayment = useCallback(async (amount: number): Promise<void> => {
    const controller = controllerRef.current;
    if (!controller) {
      throw new Error("School session is not active.");
    }
    return controller.processPayment(amount);
  }, []);

  const value = useMemo<SchoolDataContextValue>(
    () => ({
      ...state,
      refreshData,
      setSelectedStudentId,
      processPayment,
    }),
    [state, refreshData, setSelectedStudentId, processPayment],
  );

  return (
    <SchoolDataContext.Provider value={value}>
      {children}
    </SchoolDataContext.Provider>
  );
}

export function useSchoolData(): SchoolDataContextValue {
  const ctx = useContext(SchoolDataContext);
  if (!ctx) {
    throw new Error("useSchoolData must be used within a SchoolDataProvider.");
  }
  return ctx;
}
