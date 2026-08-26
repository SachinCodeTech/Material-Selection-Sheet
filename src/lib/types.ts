export type Material = {
  id: string;
  [key: string]: string;
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
  lastModified: string;
  sections: Section[];
  date: string;
  owner: string | null;
  pageSize?: string;
};

