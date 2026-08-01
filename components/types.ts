export type ColumnItem = {
  _id: string;
  title: string;
  color: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TodoItem = {
  _id: string;
  title: string;
  description: string;
  columnId: string;
  order: number;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BoardData = {
  columns: ColumnItem[];
  todos: TodoItem[];
};
