export type ClusterSubject = {
  subject: string;
  count: number;
};

export type ClusterGroup = {
  cluster: number;
  ids: string[];
  short_name: string[];
  count: number;
  top_subjects: ClusterSubject[];
};

export type BurialObject = {
  burial_id: number;
  kkm: string;
  burial_name: string;
  burial_short_name: string;
  items: string[];
};
