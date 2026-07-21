import { Check, CheckCircle2, GraduationCap, Hammer, Laptop, MapPin, MessageCircleQuestion, Minus, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { Badge, Button, Card, CardTitle, Callout, SectionTitle } from "@/components/ui";
import { COHORT_18, TUITION_KRW, BANK_ACCOUNT, formatKRW } from "@/lib/core/constants";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { SelfCheck } from "./self-check";

export const metadata = {
  title: "과정 안내 | AI4CEO Portal",
  description: "CEO를 위한 AI 바이브 코딩 스쿨 18기 — 커리큘럼, 일정, 수강료, 강사 소개",
};

// Design Ref: 18기 공식 모집 안내(CEO를 위한 AI코딩스쿨(18기).docx) 전문 반영

const AUDIENCE = [
  "코딩을 한 번도 안 해 봤는데, AI와 LLM을 잘 이해하고 싶다",
  "완전히 문과 출신이라 수학이나 전산 이런 쪽 하고는 거리가 멀다",
  "다른 CEO·임원들과 차별화된 경쟁력을 갖고 싶다",
  "기업 조직을 리드하는 임원인데, AI에 대해서 확실하게 이해하고 도입하고 싶다",
  "CEO는 아닌데, AI를 꼭 이해하고 싶다",
];

const TECH_TOPICS = [
  "다양한 LLM의 장단점 이해 — GPT, Claude Sonnet/Opus, Gemini, Deepseek, Llama, Gemma, Qwen, Solar 등",
  "Claude Code를 활용한 AI 코딩법 및 디버깅 방법",
  "LLM 애플리케이션 구현 방식에 대한 7가지 아키텍처",
  "PC에서 오픈소스 LLM 직접 작동해보기 (Ollama)",
  "Claude Code로 터미널에서 AI 에이전트 코딩하기",
  "Vercel · Supabase와 Claude Design을 활용해 웹 UI까지 만들어 챗봇 작동시키기",
  "내가 말한 내용을 텍스트로, 텍스트로 쓴 글을 원하는 성우 목소리로 읽게 하기 (TTS)",
  "OpenAI Assistant API로 AI Agent와 RAG 구현하기",
  "Langchain으로 Vector DB에 내 PDF를 올리고 질의·응답하는 RAG 구현하기",
  "위 RAG를 오픈소스로 구현하기",
  "AI Agent를 활용해 자동화된 비즈니스 프로세스를 설계하는 방법",
];

const SCHEDULE: { week: string; date: string; content: string }[] = [
  { week: "1주차", date: "9/9 (수)", content: "AI·LLM의 핵심 이해와 바이브코딩 시작 · 주요 LLM(Claude·GPT·Gemini) 비교 · Claude Code 설치 및 첫 코딩 실습" },
  { week: "2주차", date: "9/16 (수)", content: "개발 환경 구축(터미널·Python·Node) · Claude Code 실전 세팅 · 첫 프로젝트 생성·디버깅" },
  { week: "3주차", date: "9/23 (수)", content: "Claude Code로 터미널에서 AI 에이전트 코딩 · 파일 자동 생성·수정과 자동 디버깅 · 효과적인 프롬프트 작성법" },
  { week: "4주차", date: "9/30 (수)", content: "LLM 애플리케이션 구현 7가지 아키텍처 · 우리 회사 적용 사례 살펴보기" },
  { week: "5주차", date: "10/7 (수)", content: "Vercel·Supabase와 Claude Design으로 웹 UI를 만들어 챗봇 작동시키기" },
  { week: "6주차", date: "10/14 (수)", content: "PC에서 오픈소스 LLM 구동(Ollama: Qwen·Llama·Gemma 등) · Claude Code로 로컬 LLM 연동하기" },
  { week: "7주차", date: "10/21 (수)", content: "음성(TTS) 구현 — 내가 쓴 글을 원하는 성우 목소리로 읽게 하기 · Claude Code로 음성 앱 제작" },
  { week: "8주차", date: "10/28 (수)", content: "RAG 구현 · Langchain + Vector DB에 내 PDF를 올려 질의·응답 · Claude Code로 RAG 앱 제작" },
  { week: "9주차", date: "11/4 (수)", content: "RAG 오픈소스로 구현하기 · AI Agent 구현(OpenAI Assistant API·오픈소스 에이전트 하네스)" },
  { week: "10주차", date: "11/11 (수)", content: "Claude Code로 업무 자동화·비즈니스 프로세스 설계 · 우리 회사 적용 방안 · 종합 프로젝트 발표" },
];

const FAQ = [
  { q: "꼭 기업의 CEO나 임원들만 들어야 하나요?", a: "가장 많은 효과를 얻는 분들은 CEO·임원이지만, 실무자가 들어도 얼마든지 좋은 내용입니다. 임원들과 함께 들으면 앞서 나가는 리더들의 시각을 접할 수 있는 좋은 기회가 됩니다." },
  { q: "컴퓨터 언어에 기본 지식이 필요한가요?", a: "전혀 필요 없습니다. Python을 알면 매우 좋지만 몰라도 Claude Code로 AI 코딩하는 방법을 처음부터 알려드립니다." },
  { q: "노트북 사양은 어떻게 준비해야 하나요?", a: "16GB RAM 이상 개인 노트북이 필요합니다. 오픈소스 LLM(Qwen·Llama4·Exaone·Gemma·Deepseek 등)을 직접 다운로드해 사용하기 때문입니다. GPU가 있는 노트북이면 더 좋습니다." },
  { q: "수업은 어떻게 진행되나요?", a: "모든 정규 수업은 Zoom 온라인으로 진행됩니다. 다만 진도와 개인별 이해도를 체크해 잘 안 되는 분들을 위한 별도의 오프라인 보충 수업도 진행합니다(횟수·장소 추후 안내)." },
  { q: "개별 지도나 컨설팅도 가능한가요?", a: "가능합니다. 강의 내용에 대한 질문사항이나 기업의 AI 도입에 따른 다양한 이슈에 대한 1:1 질의응답도 지원합니다." },
];

// Design Ref: prd-v30-remaining.design.md §4 F1 — SCR-01 비교 3축 (정적)
const COMPARE_AXES: { axis: string; ours: string; exec: 0 | 1; platform: 0 | 1; youtube: 0 | 1 }[] = [
  { axis: "직접 만드는 실습", ours: "매주 누적 실습 — 수료 기준이 결과물", exec: 0, platform: 1, youtube: 0 },
  { axis: "CEO의 의사결정 관점", ours: "견적 검증·조직 적용·ROI 판단 중심 설계", exec: 1, platform: 0, youtube: 0 },
  { axis: "수료 후 지속", ours: "포털·AI 조교·동문 멤버십으로 계속 연결", exec: 0, platform: 0, youtube: 0 },
];

interface PublicBuild {
  id: string;
  title: string | null;
  description: string | null;
  apply_status?: string | null;
}

const APPLY_LABEL: Record<string, { label: string; tone: "progress" | "done" | "wait" | "neutral" }> = {
  review: { label: "회사 적용 검토 중", tone: "wait" },
  pilot: { label: "파일럿 진행 중", tone: "progress" },
  applied: { label: "회사 적용 완료", tone: "done" },
};

// SCR-01 ② — 공개 동의(visibility='public')된 수료생 결과물 최대 3건. 없으면 섹션 숨김.
async function getPublicBuilds(): Promise<PublicBuild[]> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("builds")
      .select("id, title, description, apply_status")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(3);
    return (data as PublicBuild[]) ?? [];
  } catch {
    return [];
  }
}

export default async function ProgramPage() {
  const publicBuilds = await getPublicBuilds();
  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-canvas">
        <div className="mx-auto max-w-[900px] px-6 pb-14 pt-16">
          <Badge tone="progress">18기 모집 중</Badge>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            CEO를 위한 AI 바이브 코딩 스쿨
          </h1>
          <p className="mt-3 text-lg text-muted">
            AI를 활용한 바이브 코딩의 비즈니스 활용 전략과 실제 구현법
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            바이브 코딩을 배우면서 AI의 핵심을 이해하고, AI를 도입하기 위해 무엇을 준비하고
            어떻게 팀을 구성하며 운영하고 ROI를 창출할 수 있는지 배웁니다. 코딩을 통해 AI를
            깊이 이해하게 되어 AI 전체에 대한 이해력을 키울 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/apply" variant="primary">지원하기</Button>
            <Button href="#schedule" variant="secondary">상세 스케줄 보기</Button>
          </div>
          <Callout className="mt-8">
            개강 {COHORT_18.eduStartLabel} · 매주 수요일 정규 강의 · Zoom 온라인 진행이라
            정원 제한 없이 모집합니다.
          </Callout>
        </div>
      </section>

      {/* Audience */}
      <section className="mx-auto max-w-[900px] px-6 py-14">
        <SectionTitle>이런 분들께 추천합니다</SectionTitle>
        <p className="mt-2 text-sm text-muted">
          이 과정은 꼭 CEO만 수강하는 것은 아닙니다. 누구나 들을 수 있으며, CEO를 명칭에 넣은
          이유는 CEO도 편하게 이해할 수 있도록 AI를 쉽게 가르친다는 의미입니다.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {AUDIENCE.map((a) => (
            <div key={a} className="flex items-start gap-2.5 rounded-[12px] border border-hairline bg-surface px-4 py-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm text-ink">{a}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Self check (SCR-01 ①) */}
      <section className="mx-auto max-w-[900px] px-6 pb-14">
        <SelfCheck />
      </section>

      {/* Purpose */}
      <section className="mx-auto max-w-[900px] px-6 py-14">
        <SectionTitle>본 과정의 목적</SectionTitle>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          이 과정의 목적은 CEO가 프로그램을 개발하는 것이 아니라, 디지털 비즈니스의 핵심을 AI
          코딩으로 직접 이해하고 이를 통해 문제를 해결하는 것입니다. AI 코딩을 배우다 보면
          비즈니스와 어떻게 연결되는지 자연스럽게 알게 되고, 예제를 풀다 보면 어떤 점이 우리
          회사에 필요한지 알게 됩니다. Anthropic Claude · OpenAI · Google Gemini를 활용해
          실제로 코드를 작성하며, 손으로 코딩한 것과의 차이와 장점을 자연스럽게 이해하게
          됩니다.
        </p>
      </section>

      {/* Program evolution note */}
      <section className="mx-auto max-w-[900px] px-6 pb-14">
        <Card className="bg-info-surface/60">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <CardTitle>커리큘럼은 매 기수 최신 도구에 맞춰 진화합니다</CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                17기는 Cursor로 시작해, 학기가 진행되며 Claude Code·Claude Design·에이전트
                하네스(Harness) 실습까지 확장했습니다. AI 코딩 도구가 몇 달 사이에도 빠르게
                바뀌는 만큼, 18기는 처음부터 Claude Code·Claude Design 중심으로 커리큘럼을
                업데이트해 시작합니다. 진행 중에도 최신 도구·기법이 나오면 즉시 반영합니다.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Technical content */}
      <section className="mx-auto max-w-[900px] px-6 py-14">
        <SectionTitle>본 과정의 기술적 내용</SectionTitle>
        <p className="mt-2 text-sm text-muted">
          이번 코스를 들으면 현재 AI를 구현하는 데 필요한 기술에 대한 해박한 이해를 갖게
          됩니다.
        </p>
        <ul className="mt-6 space-y-3">
          {TECH_TOPICS.map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-sm text-ink">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Schedule */}
      <section id="schedule" className="mx-auto max-w-[900px] scroll-mt-20 px-6 py-14">
        <SectionTitle>상세 강의 스케줄</SectionTitle>
        <p className="mt-2 text-sm text-muted">
          모든 정규 수업은 매주 수요일 오후 6시 Zoom으로 진행됩니다. 일정은 진행 상황에 따라
          일부 조정될 수 있습니다.
        </p>
        <div className="mt-6 overflow-hidden rounded-[15px] border border-hairline bg-surface">
          <div className="divide-y divide-hairline">
            {SCHEDULE.map((s) => (
              <div key={s.week} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex shrink-0 items-center gap-2 sm:w-32">
                  <Badge tone="info">{s.week}</Badge>
                  <span className="tnum text-xs text-muted">{s.date}</span>
                </div>
                <p className="text-sm text-ink">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Graduate builds preview (SCR-01 ②) */}
      {publicBuilds.length > 0 ? (
        <section className="mx-auto max-w-[900px] px-6 py-14">
          <SectionTitle>수료생이 직접 만든 것들</SectionTitle>
          <p className="mt-2 text-sm text-muted">
            공개에 동의한 수료생 결과물입니다. 코딩 경험 없이 시작한 CEO들이 과정 중에 직접
            만들었습니다.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {publicBuilds.map((b) => (
              <Card key={b.id}>
                <div className="flex items-center gap-2 text-primary">
                  <Hammer size={16} />
                  <span className="text-xs font-semibold">수료생 Build</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-ink">{b.title ?? "무제"}</div>
                {b.description ? (
                  <p className="mt-1.5 line-clamp-3 text-[13px] text-muted">{b.description}</p>
                ) : null}
                {b.apply_status && APPLY_LABEL[b.apply_status] ? (
                  <Badge tone={APPLY_LABEL[b.apply_status].tone} className="mt-3">
                    {APPLY_LABEL[b.apply_status].label}
                  </Badge>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Comparison (SCR-01 ⑤) */}
      <section className="mx-auto max-w-[900px] px-6 py-14">
        <SectionTitle>다른 과정과 무엇이 다른가</SectionTitle>
        <p className="mt-2 text-sm text-muted">
          최고위과정·실무자 플랫폼 강의·유튜브와 세 가지 축에서 비교했습니다.
        </p>
        <div className="mt-6 overflow-x-auto rounded-[15px] border border-hairline bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs text-muted">
                <th className="px-5 py-3 font-semibold">비교 축</th>
                <th className="px-5 py-3 font-semibold text-primary">본 과정</th>
                <th className="px-5 py-3 font-semibold">대학·언론사 최고위과정</th>
                <th className="px-5 py-3 font-semibold">플랫폼 실무 강의</th>
                <th className="px-5 py-3 font-semibold">유튜브·서적</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {COMPARE_AXES.map((row) => (
                <tr key={row.axis}>
                  <td className="px-5 py-4 font-semibold text-ink">{row.axis}</td>
                  <td className="px-5 py-4 text-[13px] text-ink">
                    <span className="flex items-start gap-1.5">
                      <Check size={15} className="mt-0.5 shrink-0 text-success" />
                      {row.ours}
                    </span>
                  </td>
                  {[row.exec, row.platform, row.youtube].map((v, i) => (
                    <td key={i} className="px-5 py-4">
                      {v ? (
                        <Check size={15} className="text-muted" />
                      ) : (
                        <Minus size={15} className="text-faint" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Instructor */}
      <section className="mx-auto max-w-[900px] px-6 py-14">
        <SectionTitle>강사 소개</SectionTitle>
        <Card className="mt-6">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-info-surface text-primary">
              <GraduationCap size={26} />
            </span>
            <div>
              <div className="text-[17px] font-semibold text-ink">장동인 교수</div>
              <div className="mt-1 text-sm text-muted">
                AIBB LAB 대표 · KAIST 김재철 AI대학원 책임교수 (컴퓨터공학 석사, 경영학 박사)
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                장동인 박사는 기업 임원들이 코딩을 이해하는 것이 비즈니스와 조직의 성공에
                중요한 요소라고 믿고 이 강의를 준비했습니다. 그동안의 경험을 모아 AI 코딩에
                대한 강의를 준비하여 한국 최초로 임원을 위한 AI 코딩 강의를 온오프라인에서
                시작합니다. 어려운 시기에 한국 기업의 새로운 도약을 위해 임원들부터 코딩과
                친숙해져서 AI 개념을 명확히 하고 비즈니스에 성공적으로 도입하기를 바라는
                마음으로 이 과정을 준비했습니다.
              </p>
              <p className="mt-3 text-sm text-muted">
                문의: 010-5259-9509 · donchang0725@gmail.com
              </p>
            </div>
          </div>
        </Card>

        <Callout className="mt-4">
          본 과정은 AIBB LAB의 자체 과정으로, KAIST AI대학원 CAIO과정(공식 과정, 담당:
          caio@kaist.ac.kr)의 실습을 보충하는 성격이지만 CAIO과정 수강과 무관하게 들으실 수
          있습니다.
        </Callout>
      </section>

      {/* Preparation + FAQ */}
      <section className="mx-auto max-w-[900px] px-6 py-14">
        <SectionTitle>준비물 및 진행 방식</SectionTitle>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 text-ink">
              <Laptop size={18} className="text-primary" />
              <CardTitle>노트북 준비</CardTitle>
            </div>
            <p className="mt-2 text-sm text-muted">
              16GB RAM 이상 개인 노트북 필수. 오픈소스 LLM(Qwen·Llama4·Exaone·Gemma·Deepseek
              등)을 직접 다운로드해 실습하므로 최소 메모리가 필요하며, GPU 탑재 노트북이면 더
              좋습니다.
            </p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-ink">
              <MapPin size={18} className="text-primary" />
              <CardTitle>진행 방식</CardTitle>
            </div>
            <p className="mt-2 text-sm text-muted">
              모든 정규 수업은 Zoom으로 진행됩니다. 진도·이해도를 체크해 필요한 분들을 위한
              오프라인 보충 수업을 별도로 운영합니다(횟수·장소 추후 안내).
            </p>
          </Card>
        </div>

        <div className="mt-10 flex items-center gap-2">
          <MessageCircleQuestion size={18} className="text-primary" />
          <SectionTitle className="!mt-0">자주 묻는 질문</SectionTitle>
        </div>
        <div className="mt-4 divide-y divide-hairline rounded-[15px] border border-hairline bg-surface">
          {FAQ.map((f) => (
            <div key={f.q} className="px-5 py-4">
              <div className="text-sm font-semibold text-ink">{f.q}</div>
              <p className="mt-1.5 text-sm text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tuition */}
      <section className="mx-auto max-w-[900px] px-6 py-14">
        <SectionTitle>수강료 및 결제 안내</SectionTitle>
        <Card className="mt-6">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tnum text-ink">{formatKRW(TUITION_KRW)}</span>
            <span className="text-sm text-muted">(VAT 포함, 개인·기업 동일, 세금계산서 발행 가능)</span>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-muted">계좌이체</dt>
              <dd className="mt-1 text-sm text-ink">
                {BANK_ACCOUNT.bank} {BANK_ACCOUNT.number} ({BANK_ACCOUNT.holder})
              </dd>
              <dd className="mt-1 text-xs text-muted">
                입금 후 이메일(donchang0725@gmail.com)로 꼭 알려주세요. 기업은 사업자등록증을
                보내시면 세금계산서를, 개인은 현금영수증을 발급해 드립니다.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">카드 결제</dt>
              <dd className="mt-1 text-sm text-ink">네이버스토어(smartstore.naver.com/aibblab)</dd>
              <dd className="mt-1 text-xs text-muted">
                결제 후 &ldquo;배송완료&rdquo; 표시가 뜨면 &ldquo;구매확정&rdquo;을 눌러주셔야
                수강료가 정산됩니다. 세금계산서도 네이버스토어에서 직접 발행할 수 있습니다.
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-hairline bg-surface-muted/40">
        <div className="mx-auto flex max-w-[900px] flex-col items-start gap-4 px-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-bold text-ink">18기 모집이 진행 중입니다</div>
            <p className="mt-1 text-sm text-muted">
              개강 {COHORT_18.eduStartLabel} · Zoom 온라인 강의라 정원 제한 없이 모집합니다.
            </p>
          </div>
          <Button href="/apply" variant="primary" className="shrink-0">지원하기</Button>
        </div>
      </section>

      <footer className="border-t border-hairline bg-canvas">
        <div className="mx-auto max-w-[900px] px-6 py-8 text-xs text-faint">
          AI4CEO Portal · AIBB LAB · 장동인 교수 · {COHORT_18.versionLabel}
        </div>
      </footer>
    </div>
  );
}
