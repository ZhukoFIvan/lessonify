export interface PaymentSummary {
    month: string;
    totalEarned: number;
    totalPending: number;
    lessonsCount: number;
    paidLessonsCount: number;
}
export interface DebtorStudent {
    studentId: string;
    studentName: string;
    avatarUrl: string | null;
    debtAmount: number;
    unpaidLessonsCount: number;
    lastLessonDate: string;
}
export interface MonthlyIncome {
    month: string;
    earned: number;
    pending: number;
}
//# sourceMappingURL=payment.d.ts.map