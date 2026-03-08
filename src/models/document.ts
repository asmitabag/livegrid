export type GridSize = Readonly<{
  rows: number;
  cols: number;
}>;

export type Document = Readonly<{
  id: string;
  title: string;

  authorId: string;
  authorName: string;

  createdAt: string; // ISO
  lastModifiedAt: string; // ISO
  lastModifiedBy: string; // userId

  gridSize: GridSize;
}>;