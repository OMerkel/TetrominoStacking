// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyStateToOptionsForm,
  bindNavigationAndSubpages,
} from "../html5/src/js/app/navigation.js";

const loadRealIndexDom = () => {
  const htmlPath = resolve(process.cwd(), "html5/src/index.html");
  const html = readFileSync(htmlPath, "utf8");
  const bodyStart = html.indexOf("<body>");
  const bodyEnd = html.lastIndexOf("</body>");
  const bodyMarkup = html.slice(bodyStart + 6, bodyEnd).trim();
  document.body.innerHTML = bodyMarkup;
};

const byId = (id) => document.getElementById(id);

const collectNodes = () => ({
  board: byId("board"),
  queue: byId("queue"),
  score: byId("score-label"),
  delay: byId("delay"),
  delayOutput: byId("delay-output"),
  mainColor: byId("maincolor"),
  mono: byId("monocolor"),
  multi: byId("multicolor"),
  pause: byId("pause-toggle"),
  mainNav: byId("main-nav"),
  menuToggle: byId("menu-toggle"),
  optionsPage: byId("options-page"),
  rulesPage: byId("rules-page"),
  aboutPage: byId("about-page"),
});

describe("index.html interaction smoke", () => {
  let nodes;
  let store;

  beforeEach(() => {
    loadRealIndexDom();
    nodes = collectNodes();
    store = {
      state: {
        settings: {
          tickMs: 300,
          mainColor: "#00ffff",
          colorMode: "multi",
        },
      },
      dispatch: vi.fn(),
      getState: vi.fn(() => store.state),
    };

    applyStateToOptionsForm(nodes, store.state);
    bindNavigationAndSubpages(nodes, store);
  });

  it("contains expected shell elements from real index.html", () => {
    expect(nodes.board).not.toBeNull();
    expect(nodes.mainNav).not.toBeNull();
    expect(nodes.optionsPage).not.toBeNull();
    expect(nodes.rulesPage).not.toBeNull();
    expect(nodes.aboutPage).not.toBeNull();
  });

  it("opens subpages from menu and returns to board via close actions", () => {
    nodes.menuToggle.click();
    expect(nodes.mainNav.classList.contains("is-hidden")).toBe(false);

    byId("nav-options").click();
    expect(nodes.optionsPage.classList.contains("is-hidden")).toBe(false);

    byId("options-close").click();
    expect(nodes.optionsPage.classList.contains("is-hidden")).toBe(true);
    expect(document.activeElement).toBe(nodes.board);

    byId("nav-rules").click();
    byId("rules-close").click();
    expect(nodes.rulesPage.classList.contains("is-hidden")).toBe(true);

    byId("nav-about").click();
    byId("about-close").click();
    expect(nodes.aboutPage.classList.contains("is-hidden")).toBe(true);
  });

  it("applies options with OK and restores current settings with cancel", () => {
    byId("nav-options").click();
    nodes.delay.value = "450";
    nodes.mainColor.value = "#111111";
    nodes.mono.checked = true;
    byId("options-ok").click();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: {
        tickMs: 450,
        mainColor: "#111111",
        colorMode: "mono",
      },
    });

    byId("nav-options").click();
    nodes.delay.value = "700";
    nodes.mainColor.value = "#ffffff";
    nodes.mono.checked = true;
    byId("options-cancel").click();

    expect(nodes.delay.value).toBe("300");
    expect(nodes.mainColor.value).toBe("#00ffff");
    expect(nodes.multi.checked).toBe(true);
    expect(nodes.optionsPage.classList.contains("is-hidden")).toBe(true);
    expect(document.activeElement).toBe(nodes.board);
  });
});
