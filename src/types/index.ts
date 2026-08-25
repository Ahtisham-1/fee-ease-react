// ==========================================
// FeeEase V3 - Centralized Domain Types
// ==========================================

export type Role = "admin" | "parent";
export type AdminTab = "overview" | "students" | "fees" | "promotion";

export type FeeType = "tuition" | "tuition+transport";
export type FeeStatus = "paid" | "pending";
export type PaymentStatus = "SUCCESS" | "FAILED";

export interface Parent {
  id: string;
  name: string;
  phone: string;
}

export interface Student {
  id: string;
  name: string;
  parentId: string;
  gradeName: string;
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

export interface NewStudentData {
  studentName: string;
  parentName: string;
  phone: string;
  grade: string;
  tuitionFee: number;
  hasTransport: boolean;
}

export interface AssignFeesPayload {
  targetClass: string;
  targetMonth: string;
  assignFees: number;
  academicYear: number;
}
