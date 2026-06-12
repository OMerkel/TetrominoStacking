// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyStateToOptionsForm,
  bindNavigationAndSubpages,
  readOptionsDraft,
} from "../html5/src/js/app/navigation.js";

const buildDom = () => {
  document.body.innerHTML = `
    <button id="menu-toggle">Menu</button>
    <nav id="main-nav" class="is-hidden"></nav>
    <button id="nav-restart">Restart</button>
    <button id="nav-options">Options</button>
    <button id="nav-rules">Rules</button>
    <button id="nav-about">About</button>

    <div id="board" tabindex="-1"></div>
    <section id="options-page" class="subpage is-hidden"></section>
    <section id="rules-page" class="subpage is-hidden"></section>
    <section id="about-page" class="subpage is-hidden"></section>

    <input id="delay" value="300" />
    <output id="delay-output">300</output>
    <input id="maincolor" value="#00ffff" />
    <input id="monocolor" type="radio" name="colormode" />
    <input id="multicolor" type="radio" name="colormode" checked />

    <button id="options-ok">OK</button>
    <button id="options-cancel">Cancel</button>
    <button id="options-close">Close</button>
    <button id="rules-close">Close</button>
    <button id="about-close">Close</button>
  `;

  return {
    board: document.getElementById("board"),
    delay: document.getElementById("delay"),
    delayOutput: document.getElementById("delay-output"),
    mainColor: document.getElementById("maincolor"),
    mono: document.getElementById("monocolor"),
    multi: document.getElementById("multicolor"),
    mainNav: document.getElementById("main-nav"),
    menuToggle: document.getElementById("menu-toggle"),
    optionsPage: document.getElementById("options-page"),
    rulesPage: document.getElementById("rules-page"),
    aboutPage: document.getElementById("about-page"),
  };
};

describe("navigation and subpage interactions", () => {
  let nodes;
  let store;

  beforeEach(() => {
    nodes = buildDom();
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

    bindNavigationAndSubpages(nodes, store);
  });

  it("toggles main navigation from menu button", () => {
    nodes.menuToggle.click();
    expect(nodes.mainNav.classList.contains("is-hidden")).toBe(false);

    nodes.menuToggle.click();
    expect(nodes.mainNav.classList.contains("is-hidden")).toBe(true);
  });

  it("opens each subpage from main navigation", () => {
    document.getElementById("nav-options").click();
    expect(nodes.optionsPage.classList.contains("is-hidden")).toBe(false);
    expect(nodes.rulesPage.classList.contains("is-hidden")).toBe(true);
    expect(nodes.aboutPage.classList.contains("is-hidden")).toBe(true);

    document.getElementById("nav-rules").click();
    expect(nodes.optionsPage.classList.contains("is-hidden")).toBe(true);
    expect(nodes.rulesPage.classList.contains("is-hidden")).toBe(false);

    document.getElementById("nav-about").click();
    expect(nodes.rulesPage.classList.contains("is-hidden")).toBe(true);
    expect(nodes.aboutPage.classList.contains("is-hidden")).toBe(false);
  });

  it("closes rules/about back to game board", () => {
    document.getElementById("nav-rules").click();
    document.getElementById("rules-close").click();
    expect(nodes.rulesPage.classList.contains("is-hidden")).toBe(true);

    document.getElementById("nav-about").click();
    document.getElementById("about-close").click();
    expect(nodes.aboutPage.classList.contains("is-hidden")).toBe(true);
    expect(document.activeElement).toBe(nodes.board);
  });

  it("applies options on OK and returns to board", () => {
    document.getElementById("nav-options").click();
    nodes.delay.value = "450";
    nodes.mainColor.value = "#111111";
    nodes.mono.checked = true;

    document.getElementById("options-ok").click();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      payload: {
        tickMs: 450,
        mainColor: "#111111",
        colorMode: "mono",
      },
    });
    expect(nodes.optionsPage.classList.contains("is-hidden")).toBe(true);
    expect(document.activeElement).toBe(nodes.board);
  });

  it("restores options on Cancel and Close", () => {
    applyStateToOptionsForm(nodes, {
      settings: {
        tickMs: 275,
        mainColor: "#123456",
        colorMode: "multi",
      },
    });

    document.getElementById("nav-options").click();
    nodes.delay.value = "600";
    nodes.mainColor.value = "#ffffff";
    nodes.mono.checked = true;
    document.getElementById("options-cancel").click();

    expect(nodes.delay.value).toBe("300");
    expect(nodes.mainColor.value).toBe("#00ffff");
    expect(nodes.multi.checked).toBe(true);
    expect(nodes.optionsPage.classList.contains("is-hidden")).toBe(true);

    document.getElementById("nav-options").click();
    nodes.delay.value = "500";
    document.getElementById("options-close").click();
    expect(nodes.delay.value).toBe("300");
  });

  it("dispatches restart and returns to board", () => {
    nodes.mainNav.classList.remove("is-hidden");
    document.getElementById("nav-restart").click();

    expect(store.dispatch).toHaveBeenCalledWith({ type: "RESTART" });
    expect(nodes.mainNav.classList.contains("is-hidden")).toBe(true);
    expect(document.activeElement).toBe(nodes.board);
  });

  it("reads options draft and updates delay output on input", () => {
    nodes.delay.value = "420";
    nodes.mainColor.value = "#abcdef";
    nodes.mono.checked = true;

    const draft = readOptionsDraft(nodes);
    expect(draft).toEqual({
      tickMs: 420,
      mainColor: "#abcdef",
      colorMode: "mono",
    });

    nodes.delay.value = "510";
    nodes.delay.dispatchEvent(new Event("input"));
    expect(nodes.delayOutput.value).toBe("510");
  });
});
