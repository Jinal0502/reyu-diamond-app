import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { isValidEmail } from "../utils/email.validator";

export interface IUserStats {
  averageRating : number;
  totalRatings : number;
  reputationScore : number;
  badgeCount : number;

  completedDeals : number;
  cancelDeals : number;
  totalVolume : number;
  totalShipments : number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";

  otp?: string;
  otpExpiresAt?: Date;
  otpPurpose?: "EMAIL_VERIFY" | "PASSWORD_RESET";

  isEmailVerified: boolean;
  isKycVerified: boolean;

  stripeAccountId?: string;

  stripeOnboardingStatus?: "NOT_CREATED" | "PENDING" | "COMPLETED";
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;

  stats : IUserStats;

  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [50, "Name cannot be more than 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      unique: true,
      validate: {
        validator: isValidEmail,
        message: "Please enter a valid email",
      },
    },

    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      trim: true,
    },

    otp: {
      type: String,
      select: false,
    },

    otpExpiresAt: {
      type: Date,
      select: false,
    },

    otpPurpose: {
      type: String,
      enum: ["EMAIL_VERIFY", "PASSWORD_RESET"],
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isKycVerified: {
      type: Boolean,
      default: false,
    },

    stripeAccountId: {
      type: String,
      trim: true,
      default: null,
    },

    stripeOnboardingStatus: {
      type: String,
      enum: ["NOT_CREATED", "PENDING", "COMPLETED"],
      default: "NOT_CREATED",
    },

    stripeChargesEnabled: {
      type: Boolean,
      default: false,
    },

    stripePayoutsEnabled: {
      type: Boolean,
      default: false,
    },

    stats : {
      averageRating : {type : Number , default : 0 , min : 0 , max : 5},
      totalRatings : { type : Number , default : 0 , min : 0},
      reputationScore: { type: Number, default: 0, min: 0, max: 1000 },
      badgeCount: { type: Number, default: 0, min: 0 },

      completedDeals: { type: Number, default: 0, min: 0 },
      cancelDeals: { type: Number, default: 0, min: 0 },
      totalVolume: { type: Number, default: 0, min: 0 },
      totalShipments: { type: Number, default: 0, min: 0 },
    }
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

// Export model
export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
