/**
 * jsdom gaps that are not production concerns.
 *
 * Every real browser implements these; jsdom does not. Guarding for them inside
 * components would be defensive code paid for in production to satisfy the test
 * environment, so the shim lives here instead.
 */
// Guarded: this file also loads for node-environment specs (the live API
// contract test), where none of these globals exist.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo(this: Element, options?: ScrollToOptions | number) {
    if (typeof options === 'object' && options?.top !== undefined)
      this.scrollTop = options.top
  } as typeof Element.prototype.scrollTo
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView)
  Element.prototype.scrollIntoView = function scrollIntoView() {}

/**
 * A ResizeObserver that actually reports a size.
 *
 * jsdom lays nothing out, so every element measures 0×0. A no-op shim therefore
 * makes any size-driven component render *nothing* — a virtualised list shows
 * zero rows and the test passes vacuously while proving the opposite of what it
 * claims. This one reads the element's inline height (which is how the log
 * viewer sets its viewport) and reports it once, synchronously.
 */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    constructor(private callback: ResizeObserverCallback) {}

    observe(target: Element) {
      const declared = Number.parseFloat((target as HTMLElement).style?.height ?? '') || 420
      const rect = { width: 900, height: declared } as DOMRectReadOnly

      this.callback(
        [{ target, contentRect: rect, borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      )
    }

    unobserve() {}
    disconnect() {}
  } as never
}
