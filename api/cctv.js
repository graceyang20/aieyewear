// 국가교통정보센터(ITS) CCTV 목록을 대신 받아오는 중계 함수.
// 인증키는 Vercel 환경변수(ITS_KEY)에만 있고, 브라우저로는 절대 내려가지 않는다.
//
// ITS 파라미터 메모 (여기서 틀리면 조용히 빈 배열이 온다)
//   type      : 'ex' = 고속도로, 'its' = 국도. 둘은 서로 다른 목록이다.
//   cctvType  : 1 = 실시간 스트리밍(HLS/.m3u8), 2 = 동영상 파일, 3 = 정지영상.
//               4 는 존재하지 않는 값이라 항상 0건이 온다.
//   getType   : json | xml

const ITS_BASE = 'https://openapi.its.go.kr:9443/cctvInfo';

function buildUrl(key, type, cctvType, box) {
  return ITS_BASE +
    '?apiKey=' + encodeURIComponent(key) +
    '&type=' + encodeURIComponent(type) +
    '&cctvType=' + encodeURIComponent(cctvType) +
    '&getType=json' +
    '&minX=' + box.minX + '&maxX=' + box.maxX +
    '&minY=' + box.minY + '&maxY=' + box.maxY;
}

function redact(url) {
  return url.replace(/apiKey=[^&]*/, 'apiKey=***');
}

// 페이지는 https 로 뜨는데 스트림이 http 면 브라우저가 혼합 콘텐츠로 막는다.
function toHttps(u) {
  return typeof u === 'string' ? u.replace(/^http:\/\//i, 'https://') : u;
}

async function fetchOne(key, type, cctvType, box) {
  const url = buildUrl(key, type, cctvType, box);
  const out = { type, url: redact(url), status: 0, count: 0, list: [], error: null };

  let r;
  try {
    r = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (e) {
    out.error = '요청 실패: ' + String((e && e.message) || e);
    return out;
  }
  out.status = r.status;

  const text = await r.text();
  if (!r.ok) {
    out.error = 'HTTP ' + r.status;
    out.raw = text.slice(0, 200);
    return out;
  }

  let j;
  try {
    j = JSON.parse(text);
  } catch (e) {
    // 키가 미승인이거나 만료되면 JSON 대신 HTML 안내가 온다
    out.error = 'JSON 이 아닌 응답입니다. 인증키가 승인되지 않았을 수 있습니다.';
    out.raw = text.slice(0, 200);
    return out;
  }

  const res = (j && j.response) || {};
  if (res.resultCode && String(res.resultCode) !== '00') {
    out.error = 'ITS 오류 ' + res.resultCode + ' ' + (res.resultMsg || '');
  }

  const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
  out.count = data.length;
  out.list = data
    .filter(c => c && c.cctvurl)
    .map(c => ({
      name: c.cctvname || '이름 없는 관측점',
      url: toHttps(c.cctvurl),
      x: Number(c.coordx),
      y: Number(c.coordy)
    }));
  return out;
}

module.exports = async function handler(req, res) {
  const q = req.query || {};

  // 키가 없으면 ITS 가 공개한 데모 키로라도 돌려 본다.
  // 배선이 맞는지 아닌지를 먼저 눈으로 확인할 수 있어야 한다.
  const envKey = process.env.ITS_KEY;
  const key = envKey || 'test';
  const usingDemoKey = !envKey;

  const box = {
    minX: q.minX || '126.80',
    maxX: q.maxX || '127.18',
    minY: q.minY || '37.44',
    maxY: q.maxY || '37.66'
  };
  const cctvType = q.cctvType || '1';           // 1 = 실시간 HLS
  const types = q.type ? [String(q.type)] : ['its', 'ex'];   // 국도 + 고속도로를 합친다

  const probes = await Promise.all(types.map(t => fetchOne(key, t, cctvType, box)));

  // 같은 주소가 두 목록에 겹쳐 오는 일이 있다
  const seen = new Set();
  const list = [];
  for (const p of probes) {
    for (const c of p.list) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      list.push(c);
    }
  }

  const diag = {
    usingDemoKey,
    keyPresent: !!envKey,
    cctvType,
    box,
    probes: probes.map(p => ({
      type: p.type, status: p.status, count: p.count,
      kept: p.list.length, error: p.error, url: p.url, raw: p.raw
    }))
  };

  if (!list.length) {
    const why = probes.map(p => p.error).filter(Boolean);
    return res.status(200).json({
      count: 0,
      list: [],
      error: why.length
        ? why.join(' / ')
        : '요청은 성공했지만 이 좌표 범위에 실시간 스트리밍 CCTV 가 0건입니다. ' +
          'minX/maxX/minY/maxY 를 넓혀 보세요.',
      diag
    });
  }

  // 목록은 자주 안 바뀐다. 2분 캐시로 호출 수를 아낀다.
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
  return res.status(200).json({ count: list.length, list, diag });
};
