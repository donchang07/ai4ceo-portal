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
  sort_order?: number | null;
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

export interface SessionQuestion {
  id: string;
  session_id: string | null; // null = /portal/qna 일반 게시판 질문 (D-10)
  cohort_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  video_position_sec: number | null;
  created_at: string;
}

export interface SessionAnswer {
  id: string;
  question_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  is_instructor: boolean;
  is_ai: boolean;
  created_at: string;
}

export interface QuestionWithAnswers extends SessionQuestion {
  answers: SessionAnswer[];
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
  // 간소화된 지원서(이름·전화·이메일)에서는 비어 있다 — 과거 기수 데이터 호환을 위해 유지.
  company: string | null;
  title: string | null;
  phone: string;
  email: string;
  motivation: string | null;
  status: "received" | "reviewing" | "accepted" | "rejected" | "waitlist";
  referral_code: string | null;
  referral_label?: string | null;
  created_at: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  source: string | null;
  status: "new" | "in_progress" | "done";
  admin_note: string | null;
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
  body_mdx?: string | null; // 상세(/trends/[slug])에서만 사용 — 목록 페치는 select 안 함
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

export interface ReferralStat {
  code: string;
  label: string | null;
  applications: number;
  accepted: number;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  channel: "alimtalk" | "email" | "sms";
  template_code: string | null;
  phone: string | null;
  status: "queued" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

export interface OutboxEvent {
  id: string;
  entity_type: string;
  event_type: string;
  status: "queued" | "sent" | "failed";
  created_at: string;
  sent_at: string | null;
}

export interface ChatRoomSummary {
  id: string;
  title: string | null;
  status: string;
  cohort_name: string | null;
  google_drive_folder_url: string | null;
  members: number;
  messages: number;
  files: number;
  last_message_at: string | null;
}

export interface ChatFileRec {
  id: string;
  name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  permission: string;
  google_drive_url: string | null;
  created_at: string;
}

export interface DriveVideoPolicy {
  id: string;
  title: string | null;
  visibility: string;
  google_drive_url: string | null;
  published_at: string | null;
}
