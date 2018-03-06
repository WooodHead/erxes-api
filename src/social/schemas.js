import mongoose from 'mongoose';

export const TwitterSchema = mongoose.Schema(
  {
    info: {
      type: Object,
    },
    token: {
      type: String,
    },
    tokenSecret: {
      type: String,
    },
  },
  { _id: false },
);

export const FacebookSchema = mongoose.Schema(
  {
    appId: {
      type: String,
    },
    pageIds: {
      type: [String],
    },
  },
  { _id: false },
);


export const GmailSchema = mongoose.Schema(
  {
    email: {
      type: String,
      // unique: true
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    tokenType: {
      type: String,
    },
    expiryDate: {
      type: String,
    }
  },
  { _id: false },
);
