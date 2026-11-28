import { ApiError } from "../services/apiClient";
import { getFees } from "../services/feeApi";
import {
  getPayments,
  sendPayment,
  type NewPaymentData,
} from "../services/paymentApi";
import { getStudents } from "../services/studentApi";
import type { FeeObligation, Payment, Student } from "../types/index";
import { buildFifoPaymentAllocations } from "../utils/feeCalculator";

export interface SchoolDataState {
  students: Student[];
  fees: FeeObligation[];
  payments: Payment[];
  selectedStudentId: string;
  isLoading: boolean;
  isRefreshing: boolean;
  isProcessingPayment: boolean;
  error: string | null;
}

export interface SchoolDataControllerDeps {
  getStudents?: () => Promise<Student[]>;
  getFees?: () => Promise<FeeObligation[]>;
  getPayments?: () => Promise<Payment[]>;
  sendPayment?: (data: NewPaymentData) => Promise<Payment>;
  onStateChange: (state: SchoolDataState) => void;
}

export interface SchoolDataController {
  start(): () => void;
  refreshData(): Promise<boolean>;
  setSelectedStudentId(studentId: string): void;
  processPayment(amount: number): Promise<void>;
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
  const submitPayment = deps.sendPayment ?? sendPayment;

  let state: SchoolDataState = {
    students: [],
    fees: [],
    payments: [],
    selectedStudentId: "",
    isLoading: true,
    isRefreshing: false,
    isProcessingPayment: false,
    error: null,
  };

  let loadEpoch = 0;
  let disposed = false;
  let paymentInFlight = false;

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
        ...state,
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
    if (disposed || paymentInFlight) {
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

  async function processPayment(amount: number): Promise<void> {
    if (disposed) {
      throw new Error("School session ended before payment could start.");
    }
    if (paymentInFlight) {
      throw new Error("A payment is already in progress. Please wait.");
    }

    const activeStudentId = resolveSelectedStudentId(
      state.students,
      state.selectedStudentId,
    );
    const studentIdNum = Number(activeStudentId);
    if (
      !activeStudentId ||
      !Number.isSafeInteger(studentIdNum) ||
      studentIdNum <= 0
    ) {
      throw new Error("No student is selected for this payment.");
    }

    const allocations = buildFifoPaymentAllocations(
      activeStudentId,
      state.fees,
      state.payments,
      amount,
    );
    if (allocations.length === 0) {
      throw new Error("No pending fee balance remaining for this student.");
    }

    paymentInFlight = true;
    commitState({
      ...state,
      isProcessingPayment: true,
    });

    let completedCount = 0;
    let skipFinallyRefresh = false;
    try {
      for (const allocation of allocations) {
        if (disposed) {
          skipFinallyRefresh = true;
          throw new Error("Payment interrupted because session ended.");
        }
        const feeIdNum = Number(allocation.feeId);
        if (!Number.isSafeInteger(feeIdNum) || feeIdNum <= 0) {
          throw new Error("Invalid fee obligation reference.");
        }

        await submitPayment({
          amount: allocation.amount,
          fee_id: feeIdNum,
          student_id: studentIdNum,
          date_time: new Date().toISOString(),
          status: "SUCCESS",
        });
        completedCount += 1;
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        skipFinallyRefresh = true;
        throw error;
      }
      if (completedCount > 0) {
        const detail = formatLoadError(error);
        throw new Error(
          `Partial payment applied (${completedCount} of ${allocations.length} fee items succeeded): ${detail}. Your ledger has been refreshed.`,
        );
      }
      throw error;
    } finally {
      try {
        if (!disposed && !skipFinallyRefresh) {
          await runLoad(true).catch(() => false);
        }
      } finally {
        paymentInFlight = false;
        if (!disposed) {
          commitState({
            ...state,
            isProcessingPayment: false,
          });
        }
      }
    }
  }

  return {
    start,
    refreshData,
    setSelectedStudentId,
    processPayment,
    getState: () => state,
  };
}
