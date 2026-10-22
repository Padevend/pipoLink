import { api } from './client';

export type AcademicUnit = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type AcademicLevel = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  units: AcademicUnit[];
};

export type AcademicFiliere = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  levels: AcademicLevel[];
};

export const academicPathsApi = {
  list: () => api.get<AcademicFiliere[]>('/academic-paths'),
};
