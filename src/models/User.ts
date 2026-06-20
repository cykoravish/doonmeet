import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  googleId: string | null;
  role: "user" | "guest";
  isGuest: boolean;
  guestExpiresAt: Date | null;
  avatar: string | null;
  avatarPublicId: string | null;
  bio: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  address: string;
  interests: string[];
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showGender: boolean;
    showAddress: boolean;
    showInterests: boolean;
  };
  guestMessageCount: number;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isVerified: boolean;
  isActive: boolean;
  lastSeenAt: Date;
  // Methods
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    // --- Auth ---
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      sparse: true, // allows multiple nulls (guests) but unique non-null emails
    },
    phone: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
      default: null, // null for Google-only users until they set a password
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },

    // --- Role ---
    role: {
      type: String,
      enum: ["user", "guest"],
      default: "user",
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    guestExpiresAt: {
      type: Date,
      default: null, // set to Date.now + 24h on guest creation
    },

    // --- Profile ---
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null }, // for Cloudinary deletion
    bio: { type: String, maxlength: [300, "Bio cannot exceed 300 characters"], default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: null,
    },
    address: {
      type: String,
      maxlength: [100, "Address cannot exceed 100 characters"],
      default: "",
    },
    interests: {
      type: [String],
      validate: {
        validator: (arr: string[]) => arr.length <= 10,
        message: "Cannot have more than 10 interests",
      },
      default: [],
    },

    // --- Privacy ---
    // User controls what others can see. Phone & email always private by default.
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      showGender: { type: Boolean, default: true },
      showAddress: { type: Boolean, default: true },
      showInterests: { type: Boolean, default: true },
    },

    // --- Guest limits ---
    guestMessageCount: { type: Number, default: 0 }, // public room messages sent

    verificationToken: { type: String, select: false, default: undefined },
    verificationExpires: { type: Date, select: false, default: undefined },
    resetPasswordToken: { type: String, select: false, default: undefined },
    resetPasswordExpires: { type: Date, select: false, default: undefined },

    // --- Account status ---
    isVerified: { type: Boolean, default: false }, // true after email link click or Google signup
    isActive: { type: Boolean, default: true }, // false = soft banned
    lastSeenAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// -------------------------
// Indexes
// -------------------------
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ isGuest: 1, guestExpiresAt: 1 }); // for guest cleanup
UserSchema.index({ isActive: 1 });

// -------------------------
// Instance method — compare password
// -------------------------
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.passwordHash) return false; // Google-only user has no password
  return bcrypt.compare(password, this.passwordHash);
};

// -------------------------
// Pre-save hook — hash password if changed
// -------------------------
UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash") || !this.passwordHash) return;

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (err) {
    throw err;
  }
});

// -------------------------
// Never return sensitive fields in JSON responses
// -------------------------
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const result = ret as unknown as Record<string, unknown>;
    delete result.passwordHash;
    delete result.googleId;
    delete result.__v;
    return result;
  },
});

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
