export type SqlQuestion = {
  userId: string;
  question: string;
};

export type SqlApprovedQuery = {
  sql: string;
  params: unknown[];
};

export type SqlRow = Record<string, unknown>;

export type SqlAnswer = {
  approvedQuery: SqlApprovedQuery;
  rows: SqlRow[];
  answer: string;
};
