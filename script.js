(function () {
  "use strict";

  const state = {
    target: "claude-code",
    refLink: "",
    roles: [
      { name: "", desc: "" },
      { name: "", desc: "" }
    ]
  };

  const ROLE1_RESEARCH = `목표: PM이 제시한 문제와 데이터 근거가 실제로 타당한지 확인하고, 지금 유저가 이 화면을 어떻게 쓰고 있을지에 대한 가설을 세운다. (PM · 데이터팀 · 리서처 관점을 통합해서 대신 수행)

관점:
- PM 관점 — 이 요구사항의 우선순위/근거가 타당한가
- 데이터팀 관점 — 이 가설을 검증하려면 어떤 지표/데이터가 필요한가
- 리서처 관점 — 유저가 이 화면에서 보일 행동 시나리오 (탐색/결정/이탈 지점)

반드시 출력:
1. PM이 제시한 문제/근거 요약
2. 그 근거가 놓치고 있을 수 있는 지점 (질문 형태로)
3. 현재 유저 행동에 대한 가설 (구체적 시나리오로)
4. 이 가설을 검증하려면 필요한 데이터/지표
5. 필요하다면, 재정의된 문제 정의

절대 하지 말 것: "데이터가 없으니 검증이 필요합니다"로 끝내지 않는다. 데이터가 아직 없어도 가설과 예상 패턴을 구체적으로 제시한다.`;

  const DIVERGENT_INTRO = `ROLE 2 — DIVERGENT DESIGN PRODUCTION
ROLE 1에서 정의한 Problem / Hypothesis / Design Brief를 기반으로, 서로 다른 사고방식을 가진 3개의 Designer Persona가 독립적으로 실제 디자인 시안을 만든다. 세 Persona는 서로의 결과를 참고하거나 절충하지 않는다.`;

  const PERSONA_OUTPUT = `독립적으로 다음을 수행:
1. Design Concept
2. 핵심 UX 전략
3. Information Architecture
4. User Flow
5. 화면 구조
6. 주요 Interaction
7. 기존 화면에서 변경되는 요소
8. 실제 UI 시안 — 가능하면 설명으로 끝내지 않고 Figma 등 사용 가능한 디자인 도구로 실제 화면을 생성한다. (참고 링크로 작업 파일이 주어졌다면, 새 파일 대신 그 파일 안에 새 페이지를 만들어 배치한다)

절대 하지 말 것: 다른 Persona의 결과를 참고하거나 절충하지 않는다. 세 시안을 하나로 합치거나 평균내지 않는다.`;

  const PERSONA_A = `${DIVERGENT_INTRO}

PERSONA A — SENIOR PRODUCT DESIGNER
20년차 Product Designer.
우선순위: 사용자 행동 흐름 / 정보 위계 / 인지부하 / 인터랙션 일관성 / 기존 서비스와의 연결 / 장기적인 UX 확장성
목표: 가장 UX 완성도가 높은 디자인을 만든다.

${PERSONA_OUTPUT}`;

  const PERSONA_B = `${DIVERGENT_INTRO}

PERSONA B — PO → PRODUCT DESIGNER
PO 경험을 가진 Product Designer.
우선순위: 핵심 문제 해결 / 사용자 행동 변화 / KPI·비즈니스 임팩트 / 구현 비용 대비 효과 / 실험 가능성 / 운영 복잡도
목표: 가장 적은 변화로 가장 큰 제품 효과를 만들 수 있는 디자인을 만든다.

${PERSONA_OUTPUT}`;

  const PERSONA_C = `${DIVERGENT_INTRO}

PERSONA C — CONCEPT PRODUCT DESIGNER
기존 UI 구조를 당연하게 받아들이지 않는 Product Designer.
우선순위: 기존 레이아웃 전제 재검토 / 새로운 탐색 방식 / 새로운 인터랙션 / 강한 정보 구조 변화 / 시각적 차별성. 초기 아이데이션 단계에서는 현재 UI나 구현 제약을 필요 이상으로 따르지 않는다.
목표: A/B가 쉽게 제안하지 않을 새로운 제품 경험을 만든다.

${PERSONA_OUTPUT}`;

  const ROLE3_GOAL_METRIC = `목표: 역할1의 가설/근거와 역할2의 세 가지 독립 시안(A/B/C)을 받아서, 프로젝트의 목표와 성공지표를 초안으로 작성하고 시안들을 그 기준으로 검토한다.

관점:
- 기존 목표와의 연속성 (유지할지, 이번 기회에 갱신할지)
- 정량적 성공지표 후보
- A/B/C 각 시안이 그 지표에 미칠 영향 예측
- 실제 데이터가 들어온 뒤 다시 열어봐야 할 질문

반드시 출력:
1. 목표 (기존 유지 or 갱신 + 이유)
2. 성공지표 후보 2~3개
3. A/B/C 시안 각각이 각 지표에 미칠 영향 예측 (절대 평균내거나 하나로 합치지 않음)
4. 지금 시점에서 가장 유력해 보이는 안 + 이유 (최종 결정 아님, PM 논의용 참고자료)
5. 데이터 확보 후 재검토해야 할 질문 리스트

절대 하지 말 것: A/B/C를 좋다/나쁘다로 서열화하지 않는다. 지표별로 어떤 안이 유리한지만 각각 제시한다.`;

  const PRESETS = {
    "pm-requirement": {
      task: "PM 기획서를 반영해 화면을 개선하거나 신규 설계",
      roles: [
        { name: "리서치-가설", desc: ROLE1_RESEARCH },
        { name: "페르소나A-시니어PD", desc: PERSONA_A },
        { name: "페르소나B-PO출신PD", desc: PERSONA_B },
        { name: "페르소나C-컨셉PD", desc: PERSONA_C },
        { name: "목표-지표", desc: ROLE3_GOAL_METRIC }
      ]
    },
    qa: {
      task: "신규 화면 디자인 QA 진행",
      roles: [
        { name: "QA 리뷰어", desc: "디바이스별로 화면을 순회하며 스펙 대비 차이와 엣지케이스를 찾아낸다" },
        { name: "리포트 작성자", desc: "발견된 이슈를 우선순위와 재현 방법을 붙여 개발팀 전달용 문서로 정리한다" }
      ]
    },
    "case-study": {
      task: "완료한 프로젝트를 포트폴리오용 케이스 스터디로 정리",
      roles: [
        { name: "스토리텔러", desc: "문제 정의부터 해결 과정, 성과까지 하나의 흐름으로 구성한다" },
        { name: "데이터 분석가", desc: "프로젝트 성과 지표와 근거를 정리해 주장을 뒷받침한다" }
      ]
    },
    research: {
      task: "유저 인터뷰 결과 synthesis",
      roles: [
        { name: "노트 정리자", desc: "인터뷰 원문에서 반복되는 패턴과 핵심 인용구를 뽑아낸다" },
        { name: "인사이트 도출자", desc: "정리된 패턴을 바탕으로 디자인 시사점과 다음 액션을 도출한다" }
      ]
    },
    renewal: {
      task: "기존 화면 구조를 새로운 IA로 리뉴얼",
      roles: [
        { name: "IA 설계자", desc: "정보 구조와 화면 흐름을 재설계한다" },
        { name: "카피라이터", desc: "화면에 들어갈 문구와 톤앤매너를 정리한다" },
        { name: "QA 리뷰어", desc: "기존 화면과의 차이, 엣지케이스를 점검한다" }
      ]
    }
  };

  const el = {
    toggleBtns: document.querySelectorAll(".toggle-btn"),
    targetHint: document.getElementById("targetHint"),
    taskInput: document.getElementById("taskInput"),
    refLinkInput: document.getElementById("refLinkInput"),
    presets: document.getElementById("presets"),
    rolesList: document.getElementById("rolesList"),
    addRoleBtn: document.getElementById("addRoleBtn"),
    output: document.getElementById("output"),
    copyBtn: document.getElementById("copyBtn"),
    resetBtn: document.getElementById("resetBtn")
  };

  const HINTS = {
    "claude-code": "진짜 서브에이전트 팀을 만들어요 — CLAUDE.md와 서브에이전트 파일이 생성되고, Claude Code가 알아서 역할 간에 위임하며 작업을 진행해요.",
    "other-ai": "채팅형 AI에 그대로 붙여넣을 수 있는 하나의 프롬프트를 만들어요 — 역할극 형태로 각 역할이 돌아가며 답하도록 구성돼요."
  };

  function slugify(name) {
    const s = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-");
    return s || "role";
  }

  function firstLine(text) {
    const line = text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    return line || text.trim();
  }

  function renderRoles() {
    el.rolesList.innerHTML = "";
    state.roles.forEach((role, i) => {
      const row = document.createElement("div");
      row.className = "role-row";

      const num = document.createElement("div");
      num.className = "role-num";
      num.textContent = String(i + 1);

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "role-name";
      nameInput.placeholder = i < 2 ? "역할 이름" : "역할 이름 (선택)";
      nameInput.value = role.name;
      nameInput.addEventListener("input", (e) => {
        state.roles[i].name = e.target.value;
        generate();
      });

      const descInput = document.createElement("textarea");
      descInput.className = "role-desc";
      descInput.rows = 2;
      descInput.placeholder = i < 2 ? "하는 일" : "하는 일 (선택)";
      descInput.value = role.desc;
      descInput.addEventListener("input", (e) => {
        state.roles[i].desc = e.target.value;
        generate();
      });

      row.appendChild(num);
      row.appendChild(nameInput);
      row.appendChild(descInput);

      if (state.roles.length > 2) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "remove-role";
        removeBtn.setAttribute("aria-label", "역할 삭제");
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
          state.roles.splice(i, 1);
          renderRoles();
          generate();
        });
        row.appendChild(removeBtn);
      }

      el.rolesList.appendChild(row);
    });

    el.addRoleBtn.style.display = state.roles.length >= 6 ? "none" : "";
  }

  function buildRefSection(heading) {
    const link = state.refLink.trim();
    if (!link) return "";
    return `\n\n## ${heading}\n${link}\n(화면을 직접 만드는 역할이 있다면, 새 파일 대신 이 링크의 파일 안에 새 페이지를 만들어 배치할 것)`;
  }

  function buildClaudeCodeOutput(task, roles) {
    const files = [];

    const agentList = roles
      .map((r) => `- **${slugify(r.name)}** (${r.name}): ${firstLine(r.desc)}`)
      .join("\n");

    const claudeMd = [
      "# CLAUDE.md",
      "",
      "## 프로젝트 개요",
      `이 프로젝트는 "${task}" 작업을 위한 서브에이전트 팀 구성입니다.`,
      "",
      "## 사용 가능한 서브에이전트",
      agentList,
      "",
      "## 위임 원칙",
      "- 작업의 각 단계에 맞는 서브에이전트에게 위임하세요.",
      "- 서브에이전트 간 결과물은 다음 역할이 바로 이어받을 수 있는 명확한 형식으로 전달하세요.",
      "- 역할 범위를 벗어나는 판단이 필요하면 먼저 사용자에게 확인하세요."
    ].join("\n") + buildRefSection("참고 자료");

    files.push({ path: "CLAUDE.md", content: claudeMd });

    roles.forEach((r) => {
      const slug = slugify(r.name);
      const body = [
        "---",
        `name: ${slug}`,
        `description: ${firstLine(r.desc)}`,
        "tools: inherit",
        "---",
        "",
        `당신은 "${task}" 워크플로우에서 **${r.name}** 역할을 맡습니다.`,
        "",
        r.desc,
        "",
        "## 작업 방식",
        "- 이 역할의 관점에서만 판단하고, 다른 역할의 영역까지 넘어가 판단하지 마세요.",
        "- 결과물은 다음 역할이 바로 이어받을 수 있는 형태로 정리하세요.",
        "- 애매한 지점은 임의로 가정하지 말고 명시적으로 표시하세요."
      ].join("\n");
      files.push({ path: `.claude/agents/${slug}.md`, content: body });
    });

    return files
      .map((f) => `=== FILE: ${f.path} ===\n${f.content}`)
      .join("\n\n");
  }

  function buildOtherAiOutput(task, roles) {
    const roleLines = roles
      .map((r) => `### ${r.name}\n${r.desc}`)
      .join("\n\n");
    const lastRole = roles[roles.length - 1].name;

    return (
      [
        `다음은 "${task}"를 위한 역할극 팀입니다. 아래 역할들을 각각 맡아 순서대로 답변해주세요.`,
        "",
        "## 팀 구성",
        roleLines,
        "",
        "## 진행 방식",
        "1. 제가 작업 내용을 공유하면, 각 역할이 자신의 관점에서 순서대로 의견을 답니다.",
        "2. 역할 간 의견이 다르면 어느 부분에서 다른지 명확히 표시해주세요.",
        `3. 마지막에 **${lastRole}** 역할이 전체를 종합해 다음 액션을 정리해주세요.`,
        "",
        "## 작업",
        task
      ].join("\n") + buildRefSection("참고 자료")
    );
  }

  function generate() {
    const task = el.taskInput.value.trim();
    const validRoles = state.roles.filter(
      (r) => r.name.trim() && r.desc.trim()
    );

    if (!task || validRoles.length < 2) {
      el.output.textContent = "작업과 역할 두 개 이상을 입력하면 프롬프트가 생성됩니다 →";
      el.output.classList.remove("filled");
      return;
    }

    const output =
      state.target === "claude-code"
        ? buildClaudeCodeOutput(task, validRoles)
        : buildOtherAiOutput(task, validRoles);

    el.output.textContent = output;
    el.output.classList.add("filled");
  }

  function setTarget(target) {
    state.target = target;
    el.toggleBtns.forEach((btn) => {
      const isActive = btn.dataset.target === target;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-checked", String(isActive));
    });
    el.targetHint.textContent = HINTS[target];
    generate();
  }

  function applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;
    el.taskInput.value = preset.task;
    state.roles = preset.roles.map((r) => ({ ...r }));
    renderRoles();
    generate();
  }

  function resetAll() {
    el.taskInput.value = "";
    el.refLinkInput.value = "";
    state.refLink = "";
    state.roles = [
      { name: "", desc: "" },
      { name: "", desc: "" }
    ];
    setTarget("claude-code");
    renderRoles();
    generate();
  }

  el.toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => setTarget(btn.dataset.target));
  });

  el.taskInput.addEventListener("input", generate);

  el.refLinkInput.addEventListener("input", (e) => {
    state.refLink = e.target.value;
    generate();
  });

  el.presets.addEventListener("click", (e) => {
    const btn = e.target.closest(".preset-btn");
    if (!btn) return;
    applyPreset(btn.dataset.preset);
  });

  el.addRoleBtn.addEventListener("click", () => {
    if (state.roles.length >= 6) return;
    state.roles.push({ name: "", desc: "" });
    renderRoles();
    generate();
  });

  el.resetBtn.addEventListener("click", resetAll);

  el.copyBtn.addEventListener("click", async () => {
    const text = el.output.textContent;
    if (!text || text.startsWith("작업과 역할")) return;
    try {
      await navigator.clipboard.writeText(text);
      el.copyBtn.textContent = "복사됨 ✓";
      el.copyBtn.classList.add("copied");
      setTimeout(() => {
        el.copyBtn.textContent = "프롬프트 복사";
        el.copyBtn.classList.remove("copied");
      }, 1500);
    } catch (err) {
      el.copyBtn.textContent = "복사 실패";
      setTimeout(() => {
        el.copyBtn.textContent = "프롬프트 복사";
      }, 1500);
    }
  });

  renderRoles();
  generate();
})();
