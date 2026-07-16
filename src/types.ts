export type Student = {
  studentName: string;
  studentId: string;
  connectingId: string;
  class: number;
};

export type Parent = {
  parentName: string;
  parentId: string;
};

export type Fee = {
  studentFeesConnectingID: string;
  fees: number;
  month: string;
  feesType: "Tution" | "Exam" | "Transport";
  feesId: string;
};

export type Transaction = {
  studentId: string;
  paidAmount: number;
  paymentDate: number;
};
