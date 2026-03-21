export type HomeworkStatus = 'ASSIGNED' | 'SUBMITTED' | 'REVIEWED';
export interface Homework {
    id: string;
    lessonId: string;
    tutorId: string;
    studentId: string;
    description: string;
    deadline: string | null;
    status: HomeworkStatus;
    feedback: string | null;
    submissionText: string | null;
    fileUrls: string[];
    attachmentUrls: string[];
    createdAt: string;
    updatedAt: string;
}
export interface HomeworkWithDetails extends Homework {
    lesson: {
        id: string;
        subject: string;
        startTime: string;
    };
    student: {
        id: string;
        name: string;
        color: string | null;
        user: {
            avatarUrl: string | null;
        } | null;
    };
    isOverdue?: boolean;
}
export interface StudentHomeworkItem extends Omit<HomeworkWithDetails, 'student'> {
    tutor: {
        id: string;
        user: {
            name: string;
            avatarUrl: string | null;
        };
    };
    isOverdue: boolean;
}
export interface CreateHomeworkRequest {
    description: string;
    deadline?: string;
    attachmentUrls?: string[];
}
export interface UpdateHomeworkRequest {
    description?: string;
    deadline?: string;
    status?: HomeworkStatus;
    feedback?: string;
}
export interface SubmitHomeworkRequest {
    submissionText?: string;
    fileUrls?: string[];
}
//# sourceMappingURL=homework.d.ts.map