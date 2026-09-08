# WEAR — In-Sight OS

관측세의 시대를 위한 AI 아이웨어 OS 프로토타입.

## 구조

- `index.html` — 프로토타입 전체. 이 파일 하나로 동작한다.
- `api/cctv.js` — GAZER 패널이 쓰는 공개 관측망 목록 중계 함수.
  인증키를 서버에만 두기 위한 것이므로 열어볼 일은 없다.

## 배포 후 해야 할 설정

Vercel 프로젝트 > Settings > Environment Variables 에서 추가한다.

| Name      | Value                          |
| --------- | ------------------------------ |
| `ITS_KEY` | its.go.kr 에서 발급받은 인증키 |

추가한 뒤 Deployments 탭에서 Redeploy 를 한 번 눌러야 반영된다.

키가 없어도 사이트는 정상 동작한다. GAZER 패널만 NO FEED 상태로 남는다.

## 인증키 신청서의 웹사이트 주소

배포가 끝나면 its.go.kr 마이페이지에서 주소를 Vercel 주소로 바꿔둔다.
