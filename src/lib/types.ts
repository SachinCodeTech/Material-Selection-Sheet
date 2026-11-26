export type Material = {
  id: string;
  'UTILITY AREA': string;
  'SURFACE AREA': string;
  'SIZE (MM)': string;
  'MODEL NAME': string;
  'COMPANY': string;
};

export type Section = {
  id: string;
  name: string;
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
};
