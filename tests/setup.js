import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!global.crypto?.randomUUID) {
  global.crypto = {
    ...global.crypto,
    randomUUID: () => "test-token",
  };
}
