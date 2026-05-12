export type IPhoneModel = string;
export type Condition = "new" | "like_new" | "good" | "fair";
export type Capacity = 64 | 128 | 256 | 512 | 1024;
export type ListingStatus =
  | "pending_expertise" | "under_expertise" | "published"
  | "sold" | "rejected" | "draft" | "unpublished";
export type TradeStatus =
  | "estimation_done" | "in_negotiation" | "agreed"
  | "completed" | "cancelled" | "expired";

export interface User {
  id: number;
  full_name: string;
  phone: string;
  phone_number: string;
  email?: string;
  is_active: boolean;
  roles: string[];
  listing_credits?: number;
  kyc?: Kyc;
  wallet?: Wallet;
  created_at: string;
}

export interface Kyc {
  id: number;
  user_id: number;
  document_type: "cni" | "passport" | "permis";
  document_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  created_at: string;
}

export interface ListingPhoto {
  id: number;
  url: string;
  type: "seller" | "expertise";
  order: number;
}

export interface Expertise {
  id: number;
  listing_id: number;
  expert_id?: number;
  quality_grade: string;
  checklist: Record<string, boolean>;
  notes?: string;
  status?: "pending" | "completed";
  completed_at: string;
}

export interface QuickSaleDecision {
  id: number;
  listing_id: number;
  offered_price: number;
  accepted: boolean;
  decided_at: string;
}

export interface Listing {
  id: number;
  seller_id: number;
  seller?: Pick<User, "id" | "full_name">;
  iphone_model: string;
  capacity: number;
  color: string;
  condition: Condition;
  imei: string;
  description?: string;
  asking_price: number;
  retail_price?: number;
  ai_suggested_price?: number;
  quality_grade?: string;
  accepts_trade: boolean;
  sale_type: "marketplace" | "quick_sale";
  plan?: "basic" | "verified_phone" | "verified_seller";
  is_boosted?: boolean;
  whatsapp_number?: string;
  payment_status?: "pending_payment" | "paid";
  expires_at?: string;
  sold_at?: string;
  status: ListingStatus;
  views_count: number;
  photos: ListingPhoto[];
  expertise?: Expertise;
  created_at: string;
  updated_at: string;
}

export interface TradeOffer {
  id: number;
  trade_id: number;
  offered_by: number;
  offeredBy?: Pick<User, "id" | "full_name">;
  soulte_amount: number;
  round_number: number;
  status: "pending" | "accepted" | "refused" | "countered";
  created_at: string;
}

export interface TradePhoto {
  id: number;
  url: string;
  order: number;
}

export interface Trade {
  id: number;
  listing_id: number;
  listing?: Listing;
  initiator_id: number;
  initiator?: User;
  initiator_iphone_model: string;
  initiator_capacity: number;
  initiator_color: string;
  initiator_condition: Condition;
  initiator_imei: string;
  initiator_asking_soulte?: number;
  platform_estimated_value?: number;
  ai_suggested_soulte?: number;
  status: TradeStatus;
  photos: TradePhoto[];
  offers: TradeOffer[];
  created_at: string;
}

export interface Transaction {
  id: number;
  listing_id: number;
  listing?: Listing;
  buyer_id: number;
  buyer?: User;
  seller_id: number;
  seller?: User;
  amount: number;
  commission: number;
  seller_net: number;
  status: "pending" | "in_retraction" | "completed" | "refunded" | "litigated";
  payment_reference?: string;
  retraction_deadline?: string;
  created_at: string;
}

export interface Litigation {
  id: number;
  transaction_id: number;
  transaction?: Transaction;
  reason: string;
  status: "open" | "resolved";
  resolution?: "refund_buyer" | "release_seller";
  resolved_at?: string;
  created_at: string;
}

export interface Delivery {
  id: number;
  transaction_id: number;
  transaction?: Transaction;
  agent_id?: number;
  agent?: User;
  status: "pending" | "assigned" | "picked_up" | "delivered";
  pickup_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface WalletTransaction {
  id: number;
  type: "credit" | "debit" | "hold" | "release";
  amount: number;
  description: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  balance: number;
  pending_balance: number;
  wallet_transactions?: WalletTransaction[];
}

export interface Withdrawal {
  id: number;
  amount: number;
  phone_number: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

export interface TroklyNotification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface Boost {
  id: number;
  listing_id: number;
  days: number;
  amount: number;
  status: "active" | "expired";
  expires_at: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
