# OBSERVER — In-Sight OS · 디자인 시스템

`index.html` 전역 `<style>` 에서 실제로 쓰이는 토큰·규칙만 추출해 정리한 문서.
컨셉은 관측세(觀測稅) 세계관의 AI 아이웨어 OS UI — 순흑 배경 위 저채도 회색 계열에
경고·강조를 담당하는 러스트 레드(amber) 한 컬러, 거친 스탬프 텍스처와 필름 그레인이 얹힌
계기판(HUD) 스타일이다.

---

## 1. 컬러 토큰

전부 `:root` CSS 변수로 정의. 배경은 완전한 검정, 텍스트는 흰색의 85% 불투명도(순백이 아님)라
전체가 살짝 가라앉은 톤을 유지한다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#000000` | 전역 배경(순흑) |
| `--lens` | `#000000` | 렌즈/뷰포트 배경 |
| `--line` | `#1C1E1B` | 기본 구분선(가장 어두운 보더) |
| `--line2` | `#2A2C29` | 강조 보더·컴포넌트 외곽선 |
| `--text` | `rgba(255,255,255,.85)` | 본문·주요 텍스트 |
| `--muted` | `#8C8F89` | 보조 텍스트·비활성 라벨 |
| `--dim` | `#5A5D57` | 더 약한 보조 텍스트 |
| `--faint` | `#343631` | 가장 흐린 텍스트·장식 |
| `--amber` / `--rust` | `#CD432C` | 유일한 강조·경고·활성 상태(러스트 레드) |
| `--amber-dim` | `#6d2418` | amber 의 어두운 변형(보더·저강조) |
| `--teal` / `--hl2` | `#8C8F89` | 2차 하이라이트(호버) — 실제론 muted 와 동일 회색 |

**운용 규칙**
- 유채색은 `--amber` 단 하나. 강조·활성·경고·CTA 호버·펄스가 전부 이 컬러로 통일된다.
- 텍스트 위계는 색의 명도로만 표현: `text → muted → dim → faint` 순으로 흐려진다.
- amber 관련 글로우·그림자는 `rgba(205,67,44,·)` (=#CD432C) 알파값으로 반복 사용.

---

## 2. 타이포그래피

### 폰트 스택
```css
--sans: 'Revans', Pretendard, -apple-system, BlinkMacSystemFont, sans-serif;
--mono: 'Revans', 'JetBrains Mono', Pretendard, ui-monospace, 'SF Mono', Consolas, monospace;
--eng:  'Revans', 'GentleMonster', 'Gentle Monster', 'GentleMonster-Condensed',
        'Archivo Narrow', Pretendard, sans-serif;
```
- **Revans (Medium)** — 라틴·숫자·문장부호 전용. 파일에 base64 TTF로 인라인 임베드돼 있고
  `unicode-range` 로 라틴 계열만 받는다. 그 밖(한글·₩·화살표 등)은 다음 폰트로 폴백.
- **Pretendard** — 한글 글리프 담당(CDN). Revans가 못 받는 문자를 전부 받는다.
- **`--eng`** — 영문 워드마크·수치용. 로컬에 Gentle Monster가 있으면 그걸, 없으면 Archivo Narrow로 폴백.
- **JetBrains Mono** — 계기판 숫자(mono) 폴백.
- 클래스 `.eng` 및 수치 요소에는 `font-feature-settings:'tnum' 1` (고정폭 숫자) 적용.

### 타이포 스케일
13px 미만 없음. 근접값을 한 단계로 통일한 8단계 스케일.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--fs-body` | `13px` | 기본 본문·라벨·메타·영문 키커 |
| `--fs-lead` | `15px` | 강조 본문·소제목 |
| `--fs-h3` | `17px` | h3 |
| `--fs-h2` | `20px` | h2 |
| `--fs-h1` | `25px` | h1 |
| `--fs-display` | `32px` | 디스플레이 수치 |
| `--fs-hero` | `44px` | 히어로 수치 |
| `--title-size` / `--fs-title` | `36px` | voice-line 타이틀 |

스케일 밖의 초대형 반응형 타이틀·수치는 `clamp()` 로 직접 지정:
- 워드마크 `.wel-mark` → `clamp(66px, 17vw, 140px)`, `line-height:.9`
- 대형 수치 `.dcx-val` → `clamp(64px, 15vw, 116px)`

### 웨이트·케이스 규칙
- 로드 웨이트: **400 / 500 / 600 / 700**. 본문 강조는 600, 라벨·수치·워드마크는 700.
- `#app{ text-transform:uppercase; }` — 앱 전체 영문·숫자를 대문자화(한글은 영향 없음).
- 기본 `line-height` 는 본문 1.35~1.7, 대형 타이틀은 0.9~1.05로 조여준다.

---

## 3. 텍스처 & 그레인 (시그니처)

이 UI의 인상을 결정하는 두 겹의 노이즈. SVG 필터로 구현.

### 3-1. `#tex` / `#tex-hard` — 거친 스탬프 텍스처
텍스트·라인·셰이프 가장자리를 갉아먹는 질감. `feTurbulence` + `feDisplacementMap`.
```html
<filter id="tex">
  <feTurbulence type="fractalNoise" baseFrequency="0.88" numOctaves="3" seed="7"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3"/>
</filter>
<filter id="tex-hard">   <!-- 워드마크·헤드라인용, 더 거칠게 -->
  <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="11"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5"/>
</filter>
```
- `baseFrequency` 가 클수록 알갱이가 잘아진다(현재 자잘한 세팅). `scale` 은 가장자리 왜곡 세기.
- 적용 대상: 온보딩·시스템 화면, 팝업, HUD 요소, 칩 등. 카메라 영상·손 커서·그레인은 **제외**.
- 대형 워드마크(`.wel-mark`, `.verify-word`, `.gather-word`)에만 `#tex-hard`.

### 3-2. `#grain` — 필름 그레인 (전역 오버레이)
화면 전체에 깔리는 입자 노이즈. 두 겹의 fractalNoise 타일.
```css
#grain      { baseFrequency:0.82; 140×140 타일; mix-blend-mode: overlay; }
#grain::after{ baseFrequency:1.1;  90×90 타일;  opacity:.5; }
```

---

## 4. 형태 · 보더 · 곡률

| 항목 | 값 | 비고 |
|---|---|---|
| 기본 보더 | `1px solid var(--line2)` | 컴포넌트 외곽선 표준 |
| 약한 구분선 | `1px solid var(--line)` | 리스트 행 구분 등 |
| Pill 라운드 | `border-radius: 999px` | 버튼·토글·태그 |
| 원형 | `border-radius: 50%` | 도트·썸네일·데모 얼굴 |
| 소형 라운드 | `2px` | 막대·바 끝 |
| 글로우 | `box-shadow: 0 0 Npx rgba(205,67,44,α)` | amber 발광 강조 |
| 비네트 | `box-shadow: 0 0 60px 28px #000` | 렌즈 가장자리 어둠 |

곡률은 "완전 pill 아니면 완전 원" 이분법에 가깝고, 중간값 라운드는 거의 안 쓴다(특수 illust 39px 정도 예외).

---

## 5. 핵심 컴포넌트 패턴

### Ghost 버튼 (기본 CTA)
```css
.ghost-btn{
  background:transparent; border:1px solid currentColor; color:var(--text);
  font-family:var(--sans); font-size:var(--fs-body);
  padding:10px 26px; border-radius:999px; transition:color .2s;
}
.ghost-btn:hover{ color:var(--amber); }              /* 호버 시 amber */
.ghost-btn:focus-visible{ outline:1px solid var(--amber); outline-offset:3px; }
.ghost-btn:disabled{ opacity:.3; color:var(--muted); }
.ghost-btn.reject{ color:var(--muted); }             /* 부정 액션 variant */
.ghost-btn.await{ animation:ctaAwait 1.9s ease-in-out infinite; } /* 대기 펄스 */
```
투명 배경 + 1px 외곽선 + pill 형태가 이 시스템의 버튼 원형. 작은 variant(`padding:8px 15px`)도 동일 골격.

### 태그 / 칩
`1px solid var(--line2)` + `border-radius:999px` + `--fs-body`. 상태 활성 시 `--amber` 채움.

### 토글 스위치
```css
.sw{ width:34px; height:18px; border-radius:999px; border:1px solid var(--line2); }
.sw::after{ width:12px; height:12px; border-radius:50%; background:var(--dim);
            transition:transform .18s; }        /* on 시 amber로 이동 */
```

### 레인지 슬라이더
트랙은 line2, thumb 은 `13px` amber 원형(`border:none`).

### 패널 타이틀
`.panel-title` → `--eng` 폰트 + tnum. `HOLD — 유지 대상 · 강도 조정` 처럼
"영문 라벨 — 한글 설명" 구조를 반복적으로 쓴다.

### 진행 도트 / 브레드크럼
`01 / 10` 형식 스텝 카운터 + 도트. 영문·숫자는 `--eng`.

---

## 6. 모션

공통 이징은 `ease` 또는 커스텀 큐빅베지어 `cubic-bezier(.2,.8,.2,1)` 계열(빠르게 붙는 감속).
지속시간은 마이크로 인터랙션 `.15~.3s`, 화면 전환·게이지 `.38~1.05s`.

주요 키프레임:
- `riseIn` — 아래에서 6px 떠오르며 페이드인. 온보딩 요소 등장 표준(딜레이 계단식).
- `eyeWake` / `lidClose` — 눈 뜨고/감는 인트로(블러+밝기+scaleY).
- `breathe`, `ctaAwait`, `pulseBar`, `gth` — amber 글로우/투명도 펄스(대기·주목 유도).
- `numIn`, `vfSnap` — 수치가 scale 로 튀며 확정되는 카운터 연출.
- `vfSpin`(회전), `vfDraw`(stroke-dashoffset 드로잉), `vfScan`/`gzScan`(스캔 라인).
- `feedIn` — 좌측에서 6px 슬라이드 인(로그 피드 갱신).

패턴: **강조/주목은 amber 글로우 펄스로, 등장/확정은 짧은 이동·스케일로** 표현한다.

---

## 7. 요약 원칙

1. **모노크롬 + 원 포인트** — 회색 명도 위계 4단 + amber 1색.
2. **13px 하한, 8단 스케일** — 근접값 병합으로 타이포 단계를 최소화.
3. **투명·1px·pill** — 버튼/칩/토글 전부 같은 골격(채움 없이 외곽선).
4. **두 겹 노이즈** — 스탬프 텍스처(`#tex`) + 필름 그레인(`#grain`)이 화면 질감을 규정.
5. **명도로 위계, 색으로 신호** — 정보 계층은 회색 명도, 상태·경고는 amber로만.
6. **영문 라벨 — 한글 설명** — `--eng` 대문자 영문 + 한글 부연을 짝지어 계기판 톤 유지.
