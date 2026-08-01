import { InferSchemaType, Model, Schema, model, models } from "mongoose";

import { COLUMN_TITLE_MAX_LENGTH } from "@/lib/validation";

const columnSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: COLUMN_TITLE_MAX_LENGTH,
    },
    color: {
      type: String,
      required: true,
      default: "slate",
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export type ColumnDocument = InferSchemaType<typeof columnSchema>;

const Column =
  (models.Column as Model<ColumnDocument>) ||
  model<ColumnDocument>("Column", columnSchema);

export default Column;
