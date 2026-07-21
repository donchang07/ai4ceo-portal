-- SCR-03 결제 위임·세금계산서 요청 — SECURITY DEFINER RPC
-- enrollments/invoices/tax_invoices에는 self-write RLS가 없다(의도).
-- blanket self-update를 열면 학생이 enrollment.status를 조작해 미결제 상태로 접근권을 탈취할 수 있으므로,
-- 컬럼을 제한한 security definer 함수로만 쓰기를 허용한다. (lookup_application_status 패턴 승계)

-- 결제 실무 위임 이메일 설정/해제 — 본인 enrollment의 billing_delegate_email만 변경
create or replace function public.set_billing_delegate(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update enrollments
    set billing_delegate_email = nullif(trim(coalesce(p_email, '')), '')
  where user_id = auth.uid();
end;
$$;

revoke all on function public.set_billing_delegate(text) from public;
grant execute on function public.set_billing_delegate(text) to authenticated;

-- 세금계산서 요청 — 본인 소유 인보이스에 한해 tax_invoices insert + invoices.biz_reg_no 갱신
create or replace function public.request_tax_invoice(p_invoice_id uuid, p_biz_reg_no text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_status text;
begin
  select e.user_id into v_owner
  from invoices i
  join enrollments e on e.id = i.enrollment_id
  where i.id = p_invoice_id;

  if v_owner is null then
    raise exception 'invoice not found';
  end if;
  if v_owner <> auth.uid() and not is_admin() then
    raise exception 'not authorized';
  end if;

  update invoices
    set biz_reg_no = nullif(trim(coalesce(p_biz_reg_no, '')), '')
  where id = p_invoice_id;

  insert into tax_invoices (invoice_id)
  values (p_invoice_id)
  returning status::text into v_status;

  return v_status;
end;
$$;

revoke all on function public.request_tax_invoice(uuid, text) from public;
grant execute on function public.request_tax_invoice(uuid, text) to authenticated;
