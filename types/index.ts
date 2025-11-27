export * from "./auth";
export * from "./api";

// Re-export school module types explicitly to avoid duplicate symbol
// (PaginatedResponse is already exported from ./api)
export type {
	Quarter,
	AcademicYear,
	Class,
	ClassStudent,
	Subject,
	ClassSubject,
	RoomType,
	Building,
	Room,
	TeacherClass,
	TeacherSubject,
	TeacherStudent,
	StudentClassSubject,
	StudentClass,
	StudentSubject,
	Student,
	CreateAcademicYearRequest,
	CreateQuarterRequest,
	CreateClassRequest,
	AddStudentToClassRequest,
	CreateSubjectRequest,
	AddSubjectToClassRequest,
	CreateBuildingRequest,
	CreateRoomRequest,
} from "./school";
