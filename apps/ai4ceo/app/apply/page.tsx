import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const inputCls =
  "min-h-11 w-full rounded-control border border-[#A9BFD6] bg-surface px-3.5 text-sm outline-none placeholder:text-muted focus:border-primary";
const labelCls = "mb-1.5 block text-sm font-semibold";

export default function ApplyPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      <main className="mx-auto max-w-[680px] px-5 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft size={15} /> 과정 소개로
        </Link>

        <h1 className="mt-4 text-2xl font-semibold">과정 지원</h1>
        <p className="mt-1 text-sm text-muted">
          로그인 없이 5분이면 됩니다. 합격하면 계정 생성 링크를 보내드립니다.
        </p>

        <form className="mt-7 rounded-card border bg-surface p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>이름</label>
              <input className={inputCls} placeholder="홍길동" />
            </div>
            <div>
              <label className={labelCls}>휴대폰</label>
              <input className={inputCls} placeholder="010-0000-0000" />
            </div>
            <div>
              <label className={labelCls}>회사명</label>
              <input className={inputCls} placeholder="예: 케이뱅크" />
            </div>
            <div>
              <label className={labelCls}>직함</label>
              <input className={inputCls} placeholder="대표이사" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>이메일</label>
              <input className={inputCls} placeholder="ceo@company.com" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>현재 AI 활용 현황</label>
              <select className={`${inputCls} appearance-none`}>
                <option>거의 사용하지 않음</option>
                <option>일부 부서에서 시범 도입</option>
                <option>전사적으로 활용 중</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>지원 동기</label>
              <textarea
                className={`${inputCls} min-h-28 resize-none py-2.5`}
                placeholder="AI로 회사에서 무엇을 바꾸고 싶으신가요?"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>
                추천 코드 <span className="font-normal text-muted">(선택)</span>
              </label>
              <input className={inputCls} placeholder="동문·파트너 추천 코드" />
            </div>
          </div>

          <label className="mt-5 flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" className="mt-1 accent-[#2C5CE6]" />
            <span>개인정보 수집·이용에 동의합니다. 지원서는 선발 목적에만 사용됩니다.</span>
          </label>

          <button
            type="submit"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-primary-hover bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            지원서 제출하기
          </button>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck size={14} className="text-success" />
            제출 즉시 접수 확인 알림톡을 보내드립니다.
          </div>
        </form>
      </main>
    </div>
  );
}
