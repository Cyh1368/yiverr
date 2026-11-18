export type Kind = "service" | "item" | "request";
export type PriceUnit = "fixed" | "hourly" | "obo";
export type PostStatus = "active" | "closed";
export type DealStatus = "pending" | "accepted" | "declined";

export type User = {
  id: string;
  name: string;
  email: string;
  college: string;
  class_year: number;
  venmo_handle: string;
};

export type Post = {
  id: string;
  user_id: string;
  kind: Kind;
  title: string;
  description: string;
  category: string;
  price: number;
  price_unit: PriceUnit;
  condition: string | null;
  images: string[];
  status: PostStatus;
  created_at: string;
};

export type Deal = {
  id: string;
  post_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  message: string;
  status: DealStatus;
  created_at: string;
};

export type Message = {
  id: string;
  deal_id: string;
  from_user_id: string;
  body: string;
  created_at: string;
};

export type DB = {
  users: User[];
  posts: Post[];
  deals: Deal[];
  messages: Message[];
};

export type Card = {
  id: string;
  kind: Kind;
  title: string;
  description: string;
  category: string;
  price: number;
  price_unit: PriceUnit;
  condition: string | null;
  images: string[];
  status: PostStatus;
  created_at: string;
  ago: string;
  poster_name: string;
  poster_college: string;
  poster_year: number;
};

export type SearchHit = {
  post_id: string;
  reason: string;
};

export type SearchBundle = {
  post_ids: string[];
  total_price: number;
  summary: string;
};

export type SearchPlan = {
  results: SearchHit[];
  bundle: SearchBundle | null;
};
