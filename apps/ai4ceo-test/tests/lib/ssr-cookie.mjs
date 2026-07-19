// @supabase/ssr(0.5) 쿠키 포맷을 재현해, 계정 세션을 쿠키 헤더로 변환한다.
// 쿠키 게이트 라우트(/api/ai/tutor)를 브라우저 없이 access_token 세션으로 호출하기 위함.
// 인코딩: value = "base64-" + base64url(JSON.stringify(session)) → createChunks 로 분할.

const BASE64_PREFIX = "base64-";
const MAX_CHUNK_SIZE = 3180;

export function projectRef(supabaseUrl) {
  return new URL(supabaseUrl).hostname.split(".")[0];
}

export function storageKey(supabaseUrl) {
  return `sb-${projectRef(supabaseUrl)}-auth-token`;
}

// @supabase/ssr chunker.createChunks 포팅(동작 동일)
function createChunks(key, value, chunkSize = MAX_CHUNK_SIZE) {
  let encodedValue = encodeURIComponent(value);
  if (encodedValue.length <= chunkSize) return [{ name: key, value }];
  const chunks = [];
  while (encodedValue.length > 0) {
    let encodedChunkHead = encodedValue.slice(0, chunkSize);
    const lastEscapePos = encodedChunkHead.lastIndexOf("%");
    if (lastEscapePos > chunkSize - 3) {
      encodedChunkHead = encodedChunkHead.slice(0, lastEscapePos);
    }
    let valueHead = "";
    while (encodedChunkHead.length > 0) {
      try {
        valueHead = decodeURIComponent(encodedChunkHead);
        break;
      } catch (error) {
        if (error instanceof URIError && encodedChunkHead.at(-3) === "%" && encodedChunkHead.length > 3) {
          encodedChunkHead = encodedChunkHead.slice(0, encodedChunkHead.length - 3);
        } else {
          throw error;
        }
      }
    }
    chunks.push(valueHead);
    encodedValue = encodedValue.slice(encodedChunkHead.length);
  }
  return chunks.map((v, i) => ({ name: `${key}.${i}`, value: v }));
}

// base64url (no padding) — @supabase/ssr stringToBase64URL 와 동등
function base64url(str) {
  return Buffer.from(str, "utf8").toString("base64url");
}

// 세션 객체 → 쿠키 [{name,value}]
export function buildAuthCookies(supabaseUrl, session) {
  const key = storageKey(supabaseUrl);
  const raw = JSON.stringify(session);
  const value = BASE64_PREFIX + base64url(raw);
  return createChunks(key, value);
}

// 쿠키 헤더 문자열(요청 Cookie 헤더용)
export function cookieHeader(supabaseUrl, session) {
  return buildAuthCookies(supabaseUrl, session)
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}
