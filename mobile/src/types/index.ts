export type Role = "admin" | "parent";
export type FeeType = "tuition" | "tuition+transport";
export type FeeStatus = "paid" | "pending";
export type PaymentStatus = "SUCCESS" | "FAILED";

export interface Student {
  id: string;
  name: string;
  parentId: string;
  gradeName: string;
  hasTransport?: boolean;
  transportFee?: number;
}

export interface FeeObligation {
  id: string;
  studentId: string;
  feeAmount: number;
  month: string;
  academicYear: number;
  feeType: FeeType;
  feeStatus: FeeStatus;
}

export interface Payment {
  id: string;
  amount: number;
  dateTime: string;
  belongsTo: string;
  status: PaymentStatus;
}

export interface PaymentAllocation {
  feeId: string;
  amount: number;
}
