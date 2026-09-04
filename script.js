(function () {
  "use strict";

  const state = {
    target: "claude-code",
    task: "",
    roles: [
      { name: "", desc: "" },
      { name: "", desc: "" }
    ]
  };

  const PRESETS = {
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

      const descInput = document.createElement("input");
      descInput.type = "text";
      descInput.className = "role-desc";
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

  function buildClaudeCodeOutput(task, roles) {
    const files = [];

    const agentList = roles
      .map((r) => `- **${slugify(r.name)}** (${r.name}): ${r.desc}`)
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
    ].join("\n");

    files.push({ path: "CLAUDE.md", content: claudeMd });

    roles.forEach((r) => {
      const slug = slugify(r.name);
      const body = [
        "---",
        `name: ${slug}`,
        `description: ${r.desc}`,
        "tools: inherit",
        "---",
        "",
        `당신은 "${task}" 워크플로우에서 **${r.name}** 역할을 맡습니다.`,
        "",
        "## 담당 업무",
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
    const roleLines = roles.map((r) => `- **${r.name}** — ${r.desc}`).join("\n");
    const lastRole = roles[roles.length - 1].name;

    return [
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
      `## 작업`,
      task
    ].join("\n");
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
