// Shared types for the application

export interface ApiError {
  status: number;
  message: string;
}

// Pagination

export interface PageParams {
  page: number;
  size: number;
  sort?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Patients

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  medicalRecordNumber: string;
  diagnosisHistory: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  medicalRecordNumber: string;
  diagnosisHistory: string;
}

export interface UpdatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  medicalRecordNumber: string;
  diagnosisHistory: string;
}

// Examinations

export type ExaminationStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type ExaminationType = "SACCADE_ANALYSIS_V1" | "SPEECH_ANALYSIS_V1";

export interface Examination {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  status: ExaminationStatus;
  examinationType: ExaminationType;
  doctorId: string;
  patientId: string;
  patientFirstName?: string;
  patientLastName?: string;
  decisionId?: string;
}

export interface CreateExaminationRequest {
  patientId: string;
  name: string;
  description: string;
  examinationType: ExaminationType;
}

export interface UpdateExaminationRequest {
  name: string;
  description: string;
  examinationType: ExaminationType;
}

export interface AvailableExaminationType {
  examinationType: ExaminationType;
  examinationTypeName: string;
}

// Raw Data Files

export interface RawDataFile {
  id: string;
  originalFilename: string;
  fileSize: number;
  fileFormat: string;
  checkSum: string;
  examinationId: string;
}

// Decisions

export interface DecisionExaminationSummary {
  id: string;
  name: string;
  examinationType: ExaminationType;
}

export interface SaccadeVelocityChart {
  time: number[];
  velocity: number[];
}

export interface DecisionSummary {
  id: string;
  doctorId: string;
  patientId: string;
  doctorComment: string;
  diseaseProbability: number;
  createdDate: string;
  updatedDate: string;
  examinations: DecisionExaminationSummary[];
}

export interface Decision extends DecisionSummary {
  saccadeVelocity?: SaccadeVelocityChart;
}

export interface CreateDecisionRequest {
  examinationIds: string[];
  doctorComment: string;
}

export interface UpdateDecisionRequest {
  examinationIds: string[];
  doctorComment: string;
}