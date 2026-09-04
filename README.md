# PD Team Builder

반복되는 작업 하나와 역할 2~3개만 입력하면, 바로 쓸 수 있는 에이전트 팀 프롬프트가 완성되는 미니 웹 도구입니다.

- **Claude Code 모드**: `CLAUDE.md`와 `.claude/agents/*.md` 서브에이전트 파일을 생성합니다.
- **다른 AI 모드**: 채팅형 AI에 바로 붙여넣을 수 있는 역할극 프롬프트 하나를 생성합니다.

특정 프로젝트에 종속되지 않는 범용 도구로, 어떤 프로젝트에서든 반복해서 쓸 수 있습니다.

## 실행

빌드 도구 없이 정적 파일로만 구성되어 있습니다.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```

## 배포

Vercel에 그대로 올리면 됩니다 (Framework Preset: Other / 별도 빌드 설정 불필요).

## 구조

```
index.html   화면 마크업
style.css    스타일
script.js    입력값 → 프롬프트 생성 로직
```
