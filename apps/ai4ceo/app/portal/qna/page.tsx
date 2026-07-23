import { requireLmsAccess } from "@/lib/db/auth";
import { getGeneralQuestions } from "@/lib/db/queries";
import { isAdmin } from "@/lib/core/access";
import { COHORT_18 } from "@/lib/core/constants";
import { QnaBoard } from "./qna-board";

// Design Ref: prd-v3-cycle3.design.md §4 — SCR /portal/qna (D-10, P1)
export default async function QnaPage() {
  const user = await requireLmsAccess();
  const cohortId = user.cohortId ?? COHORT_18.id;
  const questions = await getGeneralQuestions(cohortId);

  return (
    <QnaBoard
      cohortId={cohortId}
      questions={questions}
      canAnswer={isAdmin(user.role) || user.role === "assistant"}
    />
  );
}
