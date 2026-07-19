// Design Ref: PRD 6.3 — core table shapes used by the UI

export type SessionType =
  | "regular_zoom"
  | "offline_supplement"
  | "coaching"
  | "special";

export interface Session {
  id: string;
  cohort_id: string;
  week_no: number;
  title: string;
  starts_at: string;
  ends_at: string;
  type: SessionType;
  place: string | null;
  zoom_url: string | null;
  description: string | null;
  content_version: number;
  is_published: boolean;
  track?: string;
}

export interface Material {
  id: string;
  session_id: string;
  title: string;
  file_path: string;
  version?: number;
  publish_at?: string | null;
}

export interface VideoRec {
  id: string;
  session_id: string;
  google_drive_url: string | null;
  title: string;
  duration_sec: number | null;
  visibility: "cohort_readonly" | "hidden";
}

export interface Assignment {
  id: string;
  cohort_id: string;
  title: string;
  description: string;
  due_at: string;
}

export interface Application {
  id: string;
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  motivation: string;
  status: "received" | "reviewing" | "accepted" | "rejected" | "waitlist";
  referral_code: string | null;
  referral_label?: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  biz_name: string;
  biz_reg_no: string | null;
  amount: number;
  status: "issued" | "paid" | "cancelled";
  method: "bank_transfer" | "smartstore" | "toss";
  student_name: string;
  created_at: string;
  paid_at: string | null;
  number: string;
}

export interface Post {
  id: string;
  board: "notice" | "qna" | "as_qna" | "brief" | "ai_trend";
  title: string;
  excerpt: string;
  category: "ai_news" | "tech" | "ax";
  audience: "public" | "student" | "alumni" | "admin_only";
  external_url: string | null;
  tags: string[];
  thumbnail: boolean;
  published_at: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  role: "student" | "assistant" | "instructor" | "admin";
  body: string;
  message_type: "text" | "notice" | "file" | "ai_answer";
  pinned?: boolean;
  mine?: boolean;
  sources?: { label: string }[];
  fileMeta?: { name: string; size: string; permission: string };
  created_at: string;
  readCount?: number;
}

export interface BuildStep {
  key: string;
  label: string;
  state: "done" | "current" | "future";
}
