import mongoose from "mongoose";

export interface IConversation extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  participantIds: mongoose.Types.ObjectId[];
  contextType: "REQUIREMENT" | "DEAL";
  contextId: mongoose.Types.ObjectId;
  contextType_ref: "Requirement" | "Deal";
  lastMessageText?: string;
  lastMessageAt?: Date;
  userSettings: Array<{
    userId: mongoose.Types.ObjectId;
    unreadCount: number;
    isMuted: boolean;
    isPinned: boolean;
    isArchived: boolean;
    lastReadAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}


const ConversationSchema = new mongoose.Schema(
    {
        participantIds : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "User",
                required : true
            },
        ],

        contextType : {
            type : String,
            enum : ["REQUIREMENT" , "DEAL"],
            required : true,
        },
        contextId : {
            type : mongoose.Schema.Types.ObjectId,
            required : true,
            refPath : "contextType_ref",
        },
        contextType_ref: {
            type : String,
            required : true,
            enum : ["Requirement" , "Deal"],
        },
        lastMessageText : {
            type : String,
            maxLength : 100
        },
        lastMessageAt : {
            type : Date,
        },
        userSettings : [
            {
                userId : {
                    type : mongoose.Schema.Types.ObjectId,
                    ref : "User"
                },
                unreadCount : {
                    type : Number,
                    default : 0
                },
                isMuted : {
                    type : Boolean,
                    default : false
                },
                isPinned : {
                    type : Boolean,
                    default : false,
                },
                isArchived : {
                    type : Boolean,
                    default : false
                },
                lastReadAt : {
                    type : Date,
                },
            },
        ],
    },
    {
        timestamps : true,
    }
);

ConversationSchema.index({participantIds : 1 , contextId : 1});
ConversationSchema.index({participantIds : 1 , updatedAt : -1});
ConversationSchema.index({contextType : 1 , contextId : 1});

export default mongoose.model<IConversation>("Conversation", ConversationSchema);
