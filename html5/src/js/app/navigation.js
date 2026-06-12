const byId = (id) => document.getElementById(id);

const hideAllPages = (pages) => {
  for (const page of Object.values(pages)) {
    page.classList.add("is-hidden");
  }
};

const showPage = (pages, key) => {
  hideAllPages(pages);
  pages[key].classList.remove("is-hidden");
};

const showGameBoard = (nodes, pages) => {
  hideAllPages(pages);
  nodes.board.focus?.();
};

export const readOptionsDraft = (nodes) => ({
  tickMs: Number(nodes.delay.value),
  mainColor: nodes.mainColor.value,
  colorMode: nodes.mono.checked ? "mono" : "multi",
});

export const applyStateToOptionsForm = (nodes, state) => {
  const { tickMs, mainColor, colorMode } = state.settings;
  nodes.delay.value = String(tickMs);
  nodes.delayOutput.value = String(tickMs);
  nodes.mainColor.value = mainColor;
  nodes.mono.checked = colorMode === "mono";
  nodes.multi.checked = colorMode === "multi";
};

export const bindNavigationAndSubpages = (nodes, store) => {
  const pages = {
    options: nodes.optionsPage,
    rules: nodes.rulesPage,
    about: nodes.aboutPage,
  };

  nodes.menuToggle.addEventListener("click", () => {
    nodes.mainNav.classList.toggle("is-hidden");
  });

  byId("nav-restart").addEventListener("click", () => {
    store.dispatch({ type: "RESTART" });
    nodes.mainNav.classList.add("is-hidden");
    showGameBoard(nodes, pages);
  });

  byId("nav-options").addEventListener("click", () => {
    nodes.mainNav.classList.add("is-hidden");
    showPage(pages, "options");
  });

  byId("nav-rules").addEventListener("click", () => {
    nodes.mainNav.classList.add("is-hidden");
    showPage(pages, "rules");
  });

  byId("nav-about").addEventListener("click", () => {
    nodes.mainNav.classList.add("is-hidden");
    showPage(pages, "about");
  });

  byId("rules-close").addEventListener("click", () => {
    showGameBoard(nodes, pages);
  });

  byId("about-close").addEventListener("click", () => {
    showGameBoard(nodes, pages);
  });

  const updateDelayOutput = () => {
    nodes.delayOutput.value = nodes.delay.value;
  };
  nodes.delay.addEventListener("input", updateDelayOutput);

  byId("options-ok").addEventListener("click", () => {
    store.dispatch({
      type: "UPDATE_SETTINGS",
      payload: readOptionsDraft(nodes),
    });
    showGameBoard(nodes, pages);
  });

  const cancelOptions = () => {
    applyStateToOptionsForm(nodes, store.getState());
    showGameBoard(nodes, pages);
  };

  byId("options-cancel").addEventListener("click", cancelOptions);
  byId("options-close").addEventListener("click", cancelOptions);
};
