import { ApiError } from "../services/apiClient";
import { getFees } from "../services/feeApi";
import { getPayments } from "../services/paymentApi";
import { getStudents } from "../services/studentApi";
import type { FeeObligation, Payment, Student } from "../types/index";

export interface SchoolDataState {
  students: Student[];
  fees: FeeObligation[];
  payments: Payment[];
  selectedStudentId: string;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export interface SchoolDataControllerDeps {
  getStudents?: () => Promise<Student[]>;
  getFees?: () => Promise<FeeObligation[]>;
  getPayments?: () => Promise<Payment[]>;
  onStateChange: (state: SchoolDataState) => void;
}

export interface SchoolDataController {
  start(): () => void;
  refreshData(): Promise<boolean>;
  setSelectedStudentId(studentId: string): void;
  getState(): SchoolDataState;
}

export function resolveSelectedStudentId(
  students: readonly Student[],
  currentStudentId: string,
): string {
  if (students.length === 0) {
    return "";
  }
  if (currentStudentId && students.some((s) => s.id === currentStudentId)) {
    return currentStudentId;
  }
  return students[0].id;
}

function formatLoadError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Could not load your school records. Please try again.";
}

export function createSchoolDataController(
  deps: SchoolDataControllerDeps,
): SchoolDataController {
  const fetchStudents = deps.getStudents ?? getStudents;
  const fetchFees = deps.getFees ?? getFees;
  const fetchPayments = deps.getPayments ?? getPayments;

  let state: SchoolDataState = {
    students: [],
    fees: [],
    payments: [],
    selectedStudentId: "",
    isLoading: true,
    isRefreshing: false,
    error: null,
  };

  let loadEpoch = 0;
  let disposed = false;

  function commitState(next: SchoolDataState): void {
    state = next;
    if (!disposed) {
      deps.onStateChange(next);
    }
  }

  async function runLoad(isRefresh: boolean): Promise<boolean> {
    if (disposed) {
      return false;
    }

    const requestEpoch = ++loadEpoch;
    commitState({
      ...state,
      isLoading: isRefresh ? state.isLoading : true,
      isRefreshing: isRefresh,
      // Keep prior error visible during pull-to-refresh/retry until new fetch settles cleanly.
      error: isRefresh ? state.error : null,
    });

    try {
      const [students, fees, payments] = await Promise.all([
        fetchStudents(),
        fetchFees(),
        fetchPayments(),
      ]);

      if (disposed || loadEpoch !== requestEpoch) {
        return false;
      }

      commitState({
        students,
        fees,
        payments,
        selectedStudentId: resolveSelectedStudentId(
          students,
          state.selectedStudentId,
        ),
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
      return true;
    } catch (error) {
      if (disposed || loadEpoch !== requestEpoch) {
        return false;
      }

      commitState({
        ...state,
        isLoading: false,
        isRefreshing: false,
        error: formatLoadError(error),
      });
      return false;
    }
  }

  function start(): () => void {
    disposed = false;
    void runLoad(false);

    return () => {
      disposed = true;
      loadEpoch += 1;
    };
  }

  function refreshData(): Promise<boolean> {
    return runLoad(true);
  }

  function setSelectedStudentId(studentId: string): void {
    if (disposed) {
      return;
    }
    if (!studentId || !state.students.some((s) => s.id === studentId)) {
      return;
    }
    if (state.selectedStudentId === studentId) {
      return;
    }
    commitState({
      ...state,
      selectedStudentId: studentId,
    });
  }

  return {
    start,
    refreshData,
    setSelectedStudentId,
    getState: () => state,
  };
}
