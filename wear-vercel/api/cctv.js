// 국가교통정보센터 CCTV 목록을 대신 받아오는 중계 함수.
// 인증키는 Vercel 환경변수(ITS_KEY)에만 있고, 브라우저로는 절대 내려가지 않는다.

export default async function handler(req, res) {
  const key = process.env.ITS_KEY;
  if (!key) {
    return res.status(500).json({
      error: 'ITS_KEY 환경변수가 없습니다. Vercel > Settings > Environment Variables 에서 추가한 뒤 다시 배포하세요.'
    });
  }

  const q = req.query || {};
  const minX = q.minX || '126.80';
  const maxX = q.maxX || '127.18';
  const minY = q.minY || '37.44';
  const maxY = q.maxY || '37.66';

  const url =
    'https://openapi.its.go.kr:9443/cctvInfo' +
    '?apiKey=' + encodeURIComponent(key) +
    '&type=its&cctvType=4&getType=json' +
    '&minX=' + minX + '&maxX=' + maxX + '&minY=' + minY + '&maxY=' + maxY;

  try {
    const r = await fetch(url);
    const text = await r.text();

    let j;
    try {
      j = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({
        error: '응답을 해석하지 못했습니다. 인증키가 승인되지 않았을 수 있습니다.',
        raw: text.slice(0, 300)
      });
    }

    const data = (j && j.response && j.response.data) || [];
    const list = data
      .filter(c => c && c.cctvurl)
      .map(c => ({
        name: c.cctvname || '이름 없는 관측점',
        url: c.cctvurl,
        x: Number(c.coordx),
        y: Number(c.coordy)
      }));

    // 목록은 자주 안 바뀐다. 2분 캐시로 호출 수를 아낀다.
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    return res.status(200).json({ count: list.length, list });
  } catch (e) {
    return res.status(502).json({ error: String((e && e.message) || e) });
  }
}
