# WEAR In-Sight OS — CCTV

관측세가 부과되는 세계를 가정한 스펙큘러티브 프로토타입. 실제 국가교통정보센터(ITS)
공개 CCTV(HLS) 스트림을 같은 출처 프록시로 끌어와 "관측점"으로 보여준다.

## 구조

```
.
├── index.html        # 프론트엔드 전체 (온보딩 + 경험)
├── assets/
│   └── turnaround/   # 나이별 360° 턴어라운드 프레임
│       ├── 04/04_000.png … 04_345.png   (24프레임, 15° 간격)
│       ├── 08/ … 39/                     (나이 4·8·12·18·20·24·29·39)
│       └── manifest.json
├── api/
│   ├── cctv.js       # ITS CCTV 목록 중계 (인증키는 서버에만)
│   └── hls.js        # m3u8/세그먼트 same-origin 프록시 (혼합콘텐츠·CORS 회피)
├── package.json
├── .env.example
└── .gitignore
```

이미지 스캔 단계의 얼굴은 `assets/turnaround/<나이>/<나이>_<각도>.png` 를 불러와
좌우 드래그로 24프레임(0~345°)을 전환해 360° 회전시킨다. 나이대는 하단
타임라인에서 선택하며, 각도는 나이대를 바꿔도 유지된다.

프론트엔드는 `/api/cctv` 로 목록을, `/api/hls?url=...` 로 스트림을 받는다.
두 함수는 Vercel 서버리스로 동작하므로 `api/` 폴더 위치가 그대로 엔드포인트가 된다.

## 배포 (Vercel)

1. 이 폴더를 GitHub 저장소로 push
2. Vercel 에서 New Project → 해당 저장소 Import
3. Settings → Environment Variables 에 `ITS_KEY` 추가 (ITS 에서 발급받은 인증키)
4. Deploy

빌드 설정은 따로 필요 없다. 정적 `index.html` + `api/` 서버리스 함수 조합이라
프레임워크 프리셋은 "Other" 로 두면 된다.

## 로컬 확인

```bash
npm i -g vercel
vercel dev
```

`vercel dev` 는 `api/` 함수까지 함께 띄워 `/api/cctv`, `/api/hls` 가 로컬에서도 동작한다.
`.env.local` 에 `ITS_KEY` 를 넣어두면 로컬에서도 실제 목록이 온다.

> 참고: `index.html` 을 파일로 직접 열거나 미리보기 iframe 안에서 열면
> 카메라(눈 인식)와 `/api/*` 호출이 막힌다. 반드시 서버(vercel dev 또는 배포본)로 연다.

## 인증키(ITS_KEY) 메모

- 발급: 국가교통정보센터(ITS) 오픈API 신청
- 미승인/만료 시 JSON 대신 HTML 안내가 오고, `/api/cctv` 는 그 사유를 그대로 돌려준다
- 좌표 범위(minX/maxX/minY/maxY)에 실시간 스트리밍 CCTV 가 0건이면 목록이 빈다 — 범위를 넓혀 확인
