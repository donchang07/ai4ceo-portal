// FR-1: 5개 테스트 계정 idempotent 생성/갱신 (기존 seed_test_users 패턴 정식화).
// 비밀번호 uscdon00, email confirm, profiles.has_password=true, role 기준 상태 보장.
// enrollment/membership 베이스라인은 best-effort(스키마 차이에 견고하게 try/catch).
//
// 실행: node tests/provision.mjs
import { admin, assertEnv, TEST_PASSWORD, ACCOUNT_EMAILS } from "./lib/supa.mjs";

const COHORT_18_ID = "00000000-0000-0000-0000-0000000000c1";

// README 표 기준 각 계정 베이스라인
const SPEC = {
  admin: { email: ACCOUNT_EMAILS.admin, role: "admin", name: "관리자", enrollment: null, membership: null },
  student: { email: ACCOUNT_EMAILS.student, role: "student", name: "재학 수강생", enrollment: "in_training", membership: null },
  alumniMember: { email: ACCOUNT_EMAILS.alumniMember, role: "alumni", name: "졸업 멤버", enrollment: "completed", membership: "active" },
  alumniNoMember: { email: ACCOUNT_EMAILS.alumniNoMember, role: "alumni", name: "졸업 미가입", enrollment: "completed", membership: null },
  applicant: { email: ACCOUNT_EMAILS.applicant, role: "applicant", name: "관심자", enrollment: null, membership: null },
};

async function findUserByEmail(sb, email) {
  // 페이지 스캔(테스트 계정 소수)
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const u = data.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    if (u) return u;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureProfile(sb, id, role, name) {
  try {
    const { error } = await sb.from("profiles").upsert(
      { id, role, name, has_password: true },
      { onConflict: "id" },
    );
    if (error) return `profiles upsert 경고(${role}): ${error.message}`;
  } catch (e) {
    return `profiles 예외: ${e.message}`;
  }
  return null;
}

async function ensureEnrollment(sb, userId, status) {
  if (!status) return null;
  try {
    const { data: existing } = await sb
      .from("enrollments")
      .select("id, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      if (existing.status !== status) {
        await sb.from("enrollments").update({ status }).eq("id", existing.id);
      }
      return null;
    }
    const { error } = await sb.from("enrollments").insert({ user_id: userId, cohort_id: COHORT_18_ID, status });
    if (error) return `enrollments insert 경고: ${error.message}`;
  } catch (e) {
    return `enrollments 예외: ${e.message}`;
  }
  return null;
}

async function ensureMembership(sb, userId, status) {
  try {
    const { data: existing } = await sb
      .from("memberships")
      .select("id, status")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (status === null) {
      // 미가입이어야 하는 계정: 기존 active 멤버십이 있으면 건드리지 않음(원복 위험) — 경고만
      if (existing && existing.status === "active") {
        return `membership 경고: ${userId} 는 미가입 기준이나 active 행 존재(수동 확인)`;
      }
      return null;
    }
    if (existing) {
      if (existing.status !== status) {
        await sb.from("memberships").update({ status }).eq("id", existing.id);
      }
      return null;
    }
    const { error } = await sb.from("memberships").insert({ user_id: userId, status });
    if (error) return `memberships insert 경고: ${error.message}`;
  } catch (e) {
    return `memberships 예외: ${e.message}`;
  }
  return null;
}

async function main() {
  assertEnv();
  const sb = admin();
  const warnings = [];
  const summary = [];

  for (const [key, spec] of Object.entries(SPEC)) {
    let user = await findUserByEmail(sb, spec.email);
    let action;
    if (!user) {
      const { data, error } = await sb.auth.admin.createUser({
        email: spec.email,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      if (error) throw new Error(`createUser(${spec.email}): ${error.message}`);
      user = data.user;
      action = "created";
    } else {
      const { error } = await sb.auth.admin.updateUserById(user.id, {
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      if (error) warnings.push(`updateUser(${spec.email}): ${error.message}`);
      action = "updated";
    }

    const w1 = await ensureProfile(sb, user.id, spec.role, spec.name);
    const w2 = await ensureEnrollment(sb, user.id, spec.enrollment);
    const w3 = await ensureMembership(sb, user.id, spec.membership);
    for (const w of [w1, w2, w3]) if (w) warnings.push(w);

    summary.push(`  ${action.padEnd(7)} ${key.padEnd(15)} ${spec.email}`);
  }

  console.log("[provision] 계정 프로비저닝 완료:");
  summary.forEach((s) => console.log(s));
  if (warnings.length) {
    console.log("[provision] 경고(비치명적):");
    warnings.forEach((w) => console.log("  - " + w));
  }
}

main().catch((e) => {
  console.error("[provision] 실패:", e.message);
  process.exit(1);
});
