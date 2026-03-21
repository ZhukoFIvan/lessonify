export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
export interface AvailabilitySlot {
    id: string;
    tutorId: string;
    dayOfWeek: number;
    startHour: number;
    startMinute: number;
    durationMinutes: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface BookingRequest {
    id: string;
    slotId: string;
    studentId: string;
    tutorId: string;
    requestedAt: string;
    status: BookingStatus;
    note?: string;
    lessonId?: string;
    createdAt: string;
    updatedAt: string;
    slot?: AvailabilitySlot;
    student?: {
        id: string;
        name: string;
        color?: string;
        user?: {
            avatarUrl?: string;
        };
    };
}
//# sourceMappingURL=availability.d.ts.map