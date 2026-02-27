# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

한국어 정적 랜딩 페이지. 단일 `index.html` 파일에 HTML/CSS가 모두 포함된 빌드 도구 없는 프로젝트.

## Development

빌드, 번들러, 패키지 매니저 없음. 브라우저에서 `index.html`을 직접 열어 확인.

```bash
open index.html
```

## Architecture

- **index.html**: 메인 랜딩 페이지 (HTML + inline CSS). 작업 대상 파일.
- **ref_base.html**: 참고용 레퍼런스 랜딩 페이지 (정율사관학원 설명회). 수정 대상 아님.
- **docs/**: bkit PDCA 상태 파일 (`.pdca-status.json`, `.bkit-memory.json`)

## Design System

- 폰트: Inter (Google Fonts CDN)
- 컬러: CSS custom properties (`--bg-color`, `--text-primary`, `--text-secondary`, `--accent-color` 등) `:root`에 선언
- 스타일: 다크 테마, 글래스모피즘(Glassmorphism) UI
- 애니메이션: CSS keyframe (`float`, `fadeUp`)과 지연 클래스 (`delay-1` ~ `delay-4`)
- 반응형: 768px 브레이크포인트에서 모바일 대응

## Conventions

- 언어: 한국어 콘텐츠
- 외부 의존성 없이 순수 HTML/CSS만 사용 (JS 없음)
- CSS는 `<style>` 태그 내 인라인으로 작성
