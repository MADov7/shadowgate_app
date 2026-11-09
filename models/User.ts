// User account. Fields required by SKILL.md: name, email (unique), passwordHash, createdAt.
// - email is stored trimmed + lowercased, so "Ali@Example.com" and "ali@example.com" are the same account.
// - passwordHash holds a bcrypt hash only (never the plain password) and is excluded from queries by default
//   (select: false) and from every JSON serialisation.
import mongoose, { type InferSchemaType, type Model } from 'mongoose';

const { Schema, model, models } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export type UserFields = InferSchemaType<typeof UserSchema>;

export const User: Model<UserFields> = (models.User as Model<UserFields>) ?? model<UserFields>('User', UserSchema);
