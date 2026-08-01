import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import {
  TODO_DESCRIPTION_MAX_LENGTH,
  TODO_TITLE_MAX_LENGTH,
} from "@/lib/validation";

const todoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: TODO_TITLE_MAX_LENGTH,
    },
    description: {
      type: String,
      trim: true,
      maxlength: TODO_DESCRIPTION_MAX_LENGTH,
      default: "",
    },
    columnId: {
      type: String,
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export type TodoDocument = InferSchemaType<typeof todoSchema>;

const Todo =
  (models.Todo as Model<TodoDocument>) ||
  model<TodoDocument>("Todo", todoSchema);

export default Todo;
