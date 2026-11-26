export type Material = {
  id: string;
  'UTILITY AREA': string;
  'SURFACE AREA': string;
  'SIZE (MM)': string;
  'MODEL NAME': string;
  'COMPANY': string;
  [key: string]: string | undefined;
};

export type Section = {
  id: string;
  name: string;
  columns?: string[];
  materials: Material[];
};

export type Project = {
  id: string;
  name: string;
  companyName: string;
  createdAt?: string;
  lastModified: string;
  sections: Section[];
  date: string;
  owner: string | null;
  pageSize?: string;
};
