// 상품 대표 이미지 — 상품별로 서로 다른 타이포그래피를 쓴다
// (토스페이먼츠 심사: 동일 이미지 반복 사용 금지).
// 래스터 파일 대신 SVG로 두어 어떤 해상도에서도 선명하게 렌더링된다.

const BLUE = "#1479E8";
const INK = "#1B2733";
const SUB = "#8A93A0";
const SURFACE = "#FFFFFF";
const LINE = "#E3E7EF";

const FONT = "Pretendard, Inter, system-ui, -apple-system, sans-serif";

interface TitleLine {
  /** 앞부분(검정) */
  lead?: string;
  /** 파란색 강조 단어 */
  accent?: string;
}

function TypeArt({
  lines,
  subtitle,
  label,
  className,
}: {
  lines: TitleLine[];
  subtitle: string;
  label: string;
  className?: string;
}) {
  // 줄 수에 맞춰 세로 중심을 잡는다 (부제 자리 확보).
  const lineHeight = 40;
  const firstBaseline = 90 - ((lines.length - 1) * lineHeight) / 2;

  return (
    <svg viewBox="0 0 320 180" role="img" aria-label={label} className={className}>
      <rect x="0.5" y="0.5" width="319" height="179" rx="10" fill={SURFACE} stroke={LINE} />
      <text
        textAnchor="middle"
        fontFamily={FONT}
        fontSize="34"
        fontWeight="800"
        letterSpacing="-1"
        fill={INK}
      >
        {lines.map((l, i) => (
          <tspan key={i} x="160" y={firstBaseline + i * lineHeight}>
            {l.lead}
            {l.accent && <tspan fill={BLUE}>{l.accent}</tspan>}
          </tspan>
        ))}
      </text>
      <text
        x="160"
        y="158"
        textAnchor="middle"
        fontFamily={FONT}
        fontSize="13"
        fontWeight="500"
        fill={SUB}
      >
        {subtitle}
      </text>
    </svg>
  );
}

function TuitionArt({ className }: { className?: string }) {
  return (
    <TypeArt
      className={className}
      label="Vibe Coding for CEO — CEO를 위한 바이브코딩 교육"
      lines={[{ lead: "Vibe" }, { lead: "Coding" }, { lead: "for ", accent: "CEO" }]}
      subtitle="CEO를 위한 바이브코딩 교육"
    />
  );
}

function MembershipArt({ className }: { className?: string }) {
  return (
    <TypeArt
      className={className}
      label="Alumni for AI4CEO — AI4CEO 동문멤버십"
      lines={[{ lead: "Alumni" }, { lead: "for" }, { accent: "AI4CEO" }]}
      subtitle="AI4CEO 동문멤버십"
    />
  );
}

const ART = {
  tuition: TuitionArt,
  membership: MembershipArt,
} as const;

export type ArtworkKey = keyof typeof ART;

export function ProductArtwork({ artwork, className }: { artwork: ArtworkKey; className?: string }) {
  const Art = ART[artwork];
  return <Art className={className} />;
}
