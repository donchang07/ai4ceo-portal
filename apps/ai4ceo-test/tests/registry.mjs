// 4.1 케이스 레지스트리 — 문서 케이스 ID ↔ 자동 테스트 구현 매핑(리포트 생성기 공유).
// AUTOMATED: 자동 테스트가 존재하는 케이스(테스트 title 접두에 해당 ID). 결과 미수집 시 skip(미실행).
// MANUAL: 자동화 불가/미대상 — 리포트에서 manual 로 집계(note 표기).

export const AUTOMATED = {
  // 접근 매트릭스 E2E (matrix.access.spec.ts)
  "AC-01": { kind: "e2e", spec: "matrix" }, "AC-02": { kind: "e2e", spec: "matrix" },
  "AC-03": { kind: "e2e", spec: "matrix" }, "AC-04": { kind: "e2e", spec: "matrix" },
  "AC-05": { kind: "e2e", spec: "matrix" }, "AC-06": { kind: "e2e", spec: "matrix" },
  "AC-07": { kind: "e2e", spec: "matrix" }, "AC-08": { kind: "e2e", spec: "matrix" },
  "AC-09": { kind: "e2e", spec: "matrix" }, "AC-10": { kind: "e2e", spec: "matrix" },
  "AC-11": { kind: "e2e", spec: "matrix" }, "AC-12": { kind: "e2e", spec: "matrix" },
  "AC-13": { kind: "e2e", spec: "matrix" },
  "AC-14": { kind: "e2e", spec: "matrix" }, "AC-16": { kind: "e2e", spec: "matrix" },
  "AC-17": { kind: "e2e", spec: "matrix" }, "AC-19": { kind: "e2e", spec: "matrix" },
  "AC-20": { kind: "e2e", spec: "matrix" }, "AC-21": { kind: "e2e", spec: "matrix" },
  "AC-23": { kind: "e2e", spec: "matrix" }, "AC-25": { kind: "e2e", spec: "matrix" },
  "AC-26": { kind: "e2e", spec: "matrix" }, "AC-27": { kind: "e2e", spec: "matrix" },
  "AC-28": { kind: "e2e", spec: "matrix" }, "AC-30": { kind: "e2e", spec: "matrix" },
  "AC-31": { kind: "e2e", spec: "matrix" },
  // 08 영상/자료 권한 셀 (matrix.access.spec.ts — sessionDetail DOM 마커/리다이렉트)
  "LMS-V09": { kind: "e2e", spec: "matrix" },
  "LMS-V10": { kind: "e2e", spec: "matrix" },
  "LMS-M04": { kind: "e2e", spec: "matrix" },

  // 상태 전이 픽스처 (transitions.spec.ts — setup 변형 → 접근 → 원복)
  "AC-32": { kind: "e2e", spec: "transitions" },
  "AC-33": { kind: "e2e", spec: "transitions" },
  "AC-34": { kind: "e2e", spec: "transitions" },

  // API 인가 (api.authz.spec.ts)
  "AI-01": { kind: "api", spec: "api.authz" },
  "LMS-AI04": { kind: "api", spec: "api.authz" },
  "SEC-10": { kind: "api", spec: "api.authz" },

  // RLS (rls.security.spec.ts)
  "SEC-01": { kind: "rls", spec: "rls" }, "SEC-02": { kind: "rls", spec: "rls" },
  "SEC-03": { kind: "rls", spec: "rls" }, "SEC-05": { kind: "rls", spec: "rls" },
  "SEC-06": { kind: "rls", spec: "rls" }, "SEC-08": { kind: "rls", spec: "rls" },
  "SEC-09": { kind: "rls", spec: "rls" }, "SEC-12": { kind: "rls", spec: "rls" },
  "AI-15": { kind: "rls", spec: "rls" },
  "LMS-Q05": { kind: "rls", spec: "rls" }, "LMS-A06": { kind: "rls", spec: "rls" },
  "LMS-ADM07": { kind: "rls", spec: "rls" },

  // 서버액션 · LMS DB 반영 (actions.lms.spec.ts)
  "LMS-Q01": { kind: "action+db", spec: "actions" },
  "LMS-Q04": { kind: "action+db", spec: "actions" },
  "LMS-A02": { kind: "action+db", spec: "actions" },
  "LMS-A03": { kind: "action+db", spec: "actions" },
  "ADM-14": { kind: "action+db", spec: "actions" },
  "ADM-15": { kind: "action+db", spec: "actions" },
  "LMS-ADM01": { kind: "action+db", spec: "actions" },
  "LMS-ADM04": { kind: "action+db", spec: "actions" },
  "LMS-ADM05": { kind: "action+db", spec: "actions" },
  "ADM-10": { kind: "action+db", spec: "actions" },
  "ADM-16": { kind: "action+db", spec: "actions" },

  // 정적 게이트 (gate-lint.mjs)
  "SEC-11": { kind: "static", spec: "gate-lint" },

  // RAG 스모크 (rag.smoke.spec.ts)
  "AI-02": { kind: "rag", spec: "rag.smoke" },
};

export const MANUAL = {
  "LMS-V05": "YouTube seek 실클릭 — cross-origin postMessage, 스모크/수동만",
  "LMS-V06": "mp4 seek 실클릭 — 수동 확인",
  "LMS-AI02": "출처 타임스탬프 칩 클릭 seek — LMS-V05 와 동일 경로(수동)",
  "AUTH-04": "매직링크 메일 수신 필요 — 수동/Admin API generateLink 우회",
  "AUTH-05": "최초 매직링크 → set-password 강제 — 수동",
  "AC-40": "모바일 하단 탭 노출 — 시각 확인(수동)",
  "AC-41": "졸업생 모바일 탭 UX 갭 — 수동",
};

// title 문자열에서 모든 케이스 ID 토큰 추출(예: "LMS-Q01/Q04" → ["LMS-Q01","LMS-Q04"])
export function extractCaseIds(title) {
  const ids = new Set();
  const re = /\b([A-Z]{2,5}-[A-Z]{0,4}\d{1,3})\b/g;
  let m;
  while ((m = re.exec(title))) ids.add(m[1]);
  return [...ids];
}
