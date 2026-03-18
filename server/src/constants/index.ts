/* ================= SUCCESS CODES ================= */
export enum SuccessCode {
  // Auth
  REGISTERED = "REGISTERED",
  EMAIL_VERIFIED = "EMAIL_VERIFIED",
  OTP_RESENT = "OTP_RESENT",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGOUT_SUCCESS = "LOGOUT_SUCCESS",
  PASSWORD_RESET_OTP_SENT = "PASSWORD_RESET_OTP_SENT",
  PASSWORD_RESET_SUCCESS = "PASSWORD_RESET_SUCCESS",

  // User
  PROFILE_FETCHED = "PROFILE_FETCHED",
  PROFILE_UPDATED = "PROFILE_UPDATED",
  FCM_TOKEN_SAVED = "FCM_TOKEN_SAVED",

  // KYC
  KYC_SUBMITTED = "KYC_SUBMITTED",
  KYC_VERIFIED = "KYC_VERIFIED",
  KYC_LIST_FETCHED = "KYC_LIST_FETCHED",

  // Inventory
  INVENTORY_CREATED = "INVENTORY_CREATED",
  INVENTORY_UPDATED = "INVENTORY_UPDATED",
  INVENTORY_DELETED = "INVENTORY_DELETED",
  INVENTORY_FETCHED = "INVENTORY_FETCHED",
  MEDIA_ADDED = "MEDIA_ADDED",
  MEDIA_REPLACED = "MEDIA_REPLACED",
  MEDIA_REMOVED = "MEDIA_REMOVED",

  // Auction
  AUCTION_CREATED = "AUCTION_CREATED",
  AUCTION_UPDATED = "AUCTION_UPDATED",
  AUCTION_DELETED = "AUCTION_DELETED",
  AUCTION_FETCHED = "AUCTION_FETCHED",
  AUCTIONS_FETCHED = "AUCTIONS_FETCHED",

  // Bid
  BID_CREATED = "BID_CREATED",
  BID_UPDATED = "BID_UPDATED",
  BIDS_FETCHED = "BIDS_FETCHED",

  // Deal
  DEAL_FETCHED = "DEAL_FETCHED",
  DEALS_FETCHED = "DEALS_FETCHED",
  DEAL_SHIPPED = "DEAL_SHIPPED",
  DEAL_DELIVERED = "DEAL_DELIVERED",
  DEAL_CANCELLED = "DEAL_CANCELLED",
  DISPUTE_RAISED = "DISPUTE_RAISED",
  DISPUTE_RESOLVED = "DISPUTE_RESOLVED",
  DEAL_PDF_GENERATED = "DEAL_PDF_GENERATED",

  // Escrow
  PAYMENT_INTENT_CREATED = "PAYMENT_INTENT_CREATED",
  ESCROW_RELEASED = "ESCROW_RELEASED",

  // Stripe
  STRIPE_ACCOUNT_CREATED = "STRIPE_ACCOUNT_CREATED",
  STRIPE_ACCOUNT_EXISTS = "STRIPE_ACCOUNT_EXISTS",
  STRIPE_ONBOARDING_LINK = "STRIPE_ONBOARDING_LINK",
  STRIPE_STATUS_FETCHED = "STRIPE_STATUS_FETCHED",

  // Chat
  CONVERSATION_INITIATED = "CONVERSATION_INITIATED",
  MESSAGE_SENT = "MESSAGE_SENT",
  MESSAGES_FETCHED = "MESSAGES_FETCHED",
  CONVERSATIONS_FETCHED = "CONVERSATIONS_FETCHED",
  CONVERSATION_MARKED_READ = "CONVERSATION_MARKED_READ",

  // Rating
  RATING_SUBMITTED = "RATING_SUBMITTED",
  RATINGS_FETCHED = "RATINGS_FETCHED",

  // Advertisement
  AD_REQUESTED = "AD_REQUESTED",
  ADS_FETCHED = "ADS_FETCHED",
  AD_FETCHED = "AD_FETCHED",
  AD_STATUS_UPDATED = "AD_STATUS_UPDATED",

  // Requirement
  REQUIREMENT_CREATED = "REQUIREMENT_CREATED",
  REQUIREMENTS_FETCHED = "REQUIREMENTS_FETCHED",
  REQUIREMENT_FETCHED = "REQUIREMENT_FETCHED",
  REQUIREMENT_UPDATED = "REQUIREMENT_UPDATED",
  REQUIREMENT_DELETED = "REQUIREMENT_DELETED",

  // Badge
  BADGES_FETCHED = "BADGES_FETCHED",
}

/* ================= ERROR CODES ================= */
export enum ErrorCode {
  // Generic
  VALIDATION_ERROR = "VALIDATION_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  NOT_VERIFIED = "NOT_VERIFIED",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",

  // Auth
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  OTP_EXPIRED = "OTP_EXPIRED",
  OTP_INVALID = "OTP_INVALID",
  OTP_REQUEST_INVALID = "OTP_REQUEST_INVALID",

  // KYC
  KYC_ALREADY_APPROVED = "KYC_ALREADY_APPROVED",
  KYC_NOT_FOUND = "KYC_NOT_FOUND",
  KYC_REQUIRED = "KYC_REQUIRED",

  // Inventory
  INVENTORY_LOCKED = "INVENTORY_LOCKED",
  INVENTORY_NOT_AVAILABLE = "INVENTORY_NOT_AVAILABLE",

  // Auction
  AUCTION_NOT_ACTIVE = "AUCTION_NOT_ACTIVE",
  AUCTION_ALREADY_EXISTS = "AUCTION_ALREADY_EXISTS",
  AUCTION_HAS_BIDS = "AUCTION_HAS_BIDS",

  // Bid
  BID_NOT_ACTIVE = "BID_NOT_ACTIVE",
  BID_CONFLICT = "BID_CONFLICT",
  SELF_BID_NOT_ALLOWED = "SELF_BID_NOT_ALLOWED",
  ALREADY_HIGHEST_BIDDER = "ALREADY_HIGHEST_BIDDER",

  // Deal
  DEAL_ALREADY_EXISTS = "DEAL_ALREADY_EXISTS",
  DEAL_ALREADY_COMPLETED = "DEAL_ALREADY_COMPLETED",
  DEAL_NOT_DISPUTED = "DEAL_NOT_DISPUTED",
  DEAL_NOT_COMPLETED = "DEAL_NOT_COMPLETED",
  SELLER_MISMATCH = "SELLER_MISMATCH",

  // Escrow
  ESCROW_NOT_HELD = "ESCROW_NOT_HELD",
  ESCROW_ALREADY_EXISTS = "ESCROW_ALREADY_EXISTS",
  BUYER_CONFIRMATION_REQUIRED = "BUYER_CONFIRMATION_REQUIRED",

  // Stripe
  STRIPE_ACCOUNT_MISSING = "STRIPE_ACCOUNT_MISSING",
  STRIPE_ACCOUNT_NOT_CREATED = "STRIPE_ACCOUNT_NOT_CREATED",

  // Chat
  CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND",
  NOT_CONVERSATION_PARTICIPANT = "NOT_CONVERSATION_PARTICIPANT",

  // Rating
  RATING_ALREADY_EXISTS = "RATING_ALREADY_EXISTS",
  SELF_RATING_NOT_ALLOWED = "SELF_RATING_NOT_ALLOWED",

  // Advertisement
  AD_NOT_ACTIVE = "AD_NOT_ACTIVE",
  AD_CAMPAIGN_EXPIRED = "AD_CAMPAIGN_EXPIRED",
  AD_CAMPAIGN_NOT_STARTED = "AD_CAMPAIGN_NOT_STARTED",

  // Requirement
  REQUIREMENT_DUPLICATE = "REQUIREMENT_DUPLICATE",

  // User
  FCM_TOKEN_REQUIRED = "FCM_TOKEN_REQUIRED",
}

/* ================= HTTP STATUS CODES ================= */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

/* ================= ERROR MESSAGES ================= */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Generic
  [ErrorCode.VALIDATION_ERROR]: "Validation error",
  [ErrorCode.BAD_REQUEST]: "Bad request",
  [ErrorCode.NOT_FOUND]: "Resource not found",
  [ErrorCode.NOT_VERIFIED]: "Account not verified",
  [ErrorCode.UNAUTHORIZED]: "Not authorized to access this route",
  [ErrorCode.FORBIDDEN]: "Forbidden",
  [ErrorCode.INTERNAL_SERVER_ERROR]: "Internal server error",
  [ErrorCode.INVALID_STATUS_TRANSITION]: "Invalid status transition",

  // Auth
  [ErrorCode.USER_ALREADY_EXISTS]: "User already exists with this email",
  [ErrorCode.EMAIL_NOT_VERIFIED]: "Email not verified. Please verify your email",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password",
  [ErrorCode.OTP_EXPIRED]: "OTP has expired",
  [ErrorCode.OTP_INVALID]: "Invalid OTP",
  [ErrorCode.OTP_REQUEST_INVALID]: "Invalid OTP request",

  // KYC
  [ErrorCode.KYC_ALREADY_APPROVED]: "KYC is already approved",
  [ErrorCode.KYC_NOT_FOUND]: "KYC record not found",
  [ErrorCode.KYC_REQUIRED]: "KYC approval is required to perform this action",

  // Inventory
  [ErrorCode.INVENTORY_LOCKED]: "Inventory is locked and cannot be modified",
  [ErrorCode.INVENTORY_NOT_AVAILABLE]: "Inventory is not available for this action",

  // Auction
  [ErrorCode.AUCTION_NOT_ACTIVE]: "Auction is not active",
  [ErrorCode.AUCTION_ALREADY_EXISTS]: "An auction already exists for this inventory",
  [ErrorCode.AUCTION_HAS_BIDS]: "Cannot modify auction with existing bids",

  // Bid
  [ErrorCode.BID_NOT_ACTIVE]: "Only active bids can be updated",
  [ErrorCode.BID_CONFLICT]: "Bid conflict detected. Please try again",
  [ErrorCode.SELF_BID_NOT_ALLOWED]: "You cannot bid on your own auction",
  [ErrorCode.ALREADY_HIGHEST_BIDDER]: "You already have the highest bid",

  // Deal
  [ErrorCode.DEAL_ALREADY_EXISTS]: "A deal already exists for this bid",
  [ErrorCode.DEAL_ALREADY_COMPLETED]: "Completed deal cannot be cancelled",
  [ErrorCode.DEAL_NOT_DISPUTED]: "Deal is not in a disputed state",
  [ErrorCode.DEAL_NOT_COMPLETED]: "Deal must be completed before this action",
  [ErrorCode.SELLER_MISMATCH]: "Seller does not match the auction",

  // Escrow
  [ErrorCode.ESCROW_NOT_HELD]: "Escrow must be in HELD status for this action",
  [ErrorCode.ESCROW_ALREADY_EXISTS]: "Escrow already exists for this deal",
  [ErrorCode.BUYER_CONFIRMATION_REQUIRED]: "Buyer must confirm delivery before releasing escrow",

  // Stripe
  [ErrorCode.STRIPE_ACCOUNT_MISSING]: "Seller does not have a Stripe account",
  [ErrorCode.STRIPE_ACCOUNT_NOT_CREATED]: "Stripe connected account has not been created",

  // Chat
  [ErrorCode.CONVERSATION_NOT_FOUND]: "Conversation not found",
  [ErrorCode.NOT_CONVERSATION_PARTICIPANT]: "You are not a participant of this conversation",

  // Rating
  [ErrorCode.RATING_ALREADY_EXISTS]: "You have already rated this deal",
  [ErrorCode.SELF_RATING_NOT_ALLOWED]: "You cannot rate yourself",

  // Advertisement
  [ErrorCode.AD_NOT_ACTIVE]: "Advertisement is not active",
  [ErrorCode.AD_CAMPAIGN_EXPIRED]: "Advertisement campaign has expired",
  [ErrorCode.AD_CAMPAIGN_NOT_STARTED]: "Advertisement campaign has not started yet",

  // Requirement
  [ErrorCode.REQUIREMENT_DUPLICATE]: "A duplicate requirement already exists",

  // User
  [ErrorCode.FCM_TOKEN_REQUIRED]: "FCM token is required",
};

/* ================= SUCCESS MESSAGES ================= */
export const SUCCESS_MESSAGES: Record<SuccessCode, string> = {
  // Auth
  [SuccessCode.REGISTERED]: "Registration successful. OTP sent to email",
  [SuccessCode.EMAIL_VERIFIED]: "Email verified successfully",
  [SuccessCode.OTP_RESENT]: "OTP resent to email",
  [SuccessCode.LOGIN_SUCCESS]: "Login successful",
  [SuccessCode.LOGOUT_SUCCESS]: "Logout successful",
  [SuccessCode.PASSWORD_RESET_OTP_SENT]: "OTP sent to email",
  [SuccessCode.PASSWORD_RESET_SUCCESS]: "Password reset successful",

  // User
  [SuccessCode.PROFILE_FETCHED]: "User profile fetched successfully",
  [SuccessCode.PROFILE_UPDATED]: "Profile updated successfully",
  [SuccessCode.FCM_TOKEN_SAVED]: "FCM token stored successfully",

  // KYC
  [SuccessCode.KYC_SUBMITTED]: "KYC submitted successfully",
  [SuccessCode.KYC_VERIFIED]: "KYC decision recorded successfully",
  [SuccessCode.KYC_LIST_FETCHED]: "KYC list retrieved successfully",

  // Inventory
  [SuccessCode.INVENTORY_CREATED]: "Inventory item created successfully",
  [SuccessCode.INVENTORY_UPDATED]: "Inventory item updated successfully",
  [SuccessCode.INVENTORY_DELETED]: "Inventory deleted successfully",
  [SuccessCode.INVENTORY_FETCHED]: "Inventory fetched successfully",
  [SuccessCode.MEDIA_ADDED]: "Media added successfully",
  [SuccessCode.MEDIA_REPLACED]: "Media replaced successfully",
  [SuccessCode.MEDIA_REMOVED]: "Media removed successfully",

  // Auction
  [SuccessCode.AUCTION_CREATED]: "Auction created successfully",
  [SuccessCode.AUCTION_UPDATED]: "Auction updated successfully",
  [SuccessCode.AUCTION_DELETED]: "Auction deleted successfully",
  [SuccessCode.AUCTION_FETCHED]: "Auction fetched successfully",
  [SuccessCode.AUCTIONS_FETCHED]: "Auctions fetched successfully",

  // Bid
  [SuccessCode.BID_CREATED]: "Bid created successfully",
  [SuccessCode.BID_UPDATED]: "Bid updated successfully",
  [SuccessCode.BIDS_FETCHED]: "Bids fetched successfully",

  // Deal
  [SuccessCode.DEAL_FETCHED]: "Deal fetched successfully",
  [SuccessCode.DEALS_FETCHED]: "Deals fetched successfully",
  [SuccessCode.DEAL_SHIPPED]: "Deal marked as shipped",
  [SuccessCode.DEAL_DELIVERED]: "Delivery confirmed successfully",
  [SuccessCode.DEAL_CANCELLED]: "Deal cancelled successfully",
  [SuccessCode.DISPUTE_RAISED]: "Dispute raised successfully",
  [SuccessCode.DISPUTE_RESOLVED]: "Dispute resolved successfully",
  [SuccessCode.DEAL_PDF_GENERATED]: "Deal PDF generated successfully",

  // Escrow
  [SuccessCode.PAYMENT_INTENT_CREATED]: "Payment intent created successfully",
  [SuccessCode.ESCROW_RELEASED]: "Payment released successfully",

  // Stripe
  [SuccessCode.STRIPE_ACCOUNT_CREATED]: "Stripe connected account created successfully",
  [SuccessCode.STRIPE_ACCOUNT_EXISTS]: "Stripe account already exists",
  [SuccessCode.STRIPE_ONBOARDING_LINK]: "Stripe onboarding link generated successfully",
  [SuccessCode.STRIPE_STATUS_FETCHED]: "Stripe account status fetched successfully",

  // Chat
  [SuccessCode.CONVERSATION_INITIATED]: "Conversation initiated successfully",
  [SuccessCode.MESSAGE_SENT]: "Message sent successfully",
  [SuccessCode.MESSAGES_FETCHED]: "Messages fetched successfully",
  [SuccessCode.CONVERSATIONS_FETCHED]: "Conversations fetched successfully",
  [SuccessCode.CONVERSATION_MARKED_READ]: "Conversation marked as read",

  // Rating
  [SuccessCode.RATING_SUBMITTED]: "Rating submitted successfully",
  [SuccessCode.RATINGS_FETCHED]: "Ratings fetched successfully",

  // Advertisement
  [SuccessCode.AD_REQUESTED]: "Advertisement request submitted successfully",
  [SuccessCode.ADS_FETCHED]: "Advertisements fetched successfully",
  [SuccessCode.AD_FETCHED]: "Advertisement fetched successfully",
  [SuccessCode.AD_STATUS_UPDATED]: "Advertisement status updated successfully",

  // Requirement
  [SuccessCode.REQUIREMENT_CREATED]: "Requirement created successfully",
  [SuccessCode.REQUIREMENTS_FETCHED]: "Requirements fetched successfully",
  [SuccessCode.REQUIREMENT_FETCHED]: "Requirement fetched successfully",
  [SuccessCode.REQUIREMENT_UPDATED]: "Requirement updated successfully",
  [SuccessCode.REQUIREMENT_DELETED]: "Requirement deleted successfully",

  // Badge
  [SuccessCode.BADGES_FETCHED]: "Badges fetched successfully",
};
