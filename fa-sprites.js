(function () {
  const spritePrefixes = new Map();

  function spritePrefix(url) {
    const file = url.split("/").pop() || url;
    return file.replace(/\.svg$/i, "");
  }

  async function loadSprite(url) {
    if (spritePrefixes.has(url)) {
      return spritePrefixes.get(url);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load sprite: ${url} (${response.status})`);
    }

    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const source = doc.querySelector("svg");

    if (!source) {
      throw new Error(`Sprite file has no SVG root: ${url}`);
    }

    const prefix = spritePrefix(url);
    const container = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    container.setAttribute("aria-hidden", "true");
    container.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden");
    container.dataset.faSprite = prefix;

    for (const symbol of source.querySelectorAll("symbol")) {
      const clone = symbol.cloneNode(true);
      clone.id = `${prefix}-${symbol.id}`;
      container.appendChild(clone);
    }

    document.body.insertBefore(container, document.body.firstChild);
    spritePrefixes.set(url, prefix);

    return prefix;
  }

  function useHref(use) {
    return use.getAttribute("href") || use.getAttribute("xlink:href");
  }

  function setUseHref(use, value) {
    use.setAttribute("href", value);
    use.removeAttribute("xlink:href");
  }

  async function upgrade(root = document) {
    const uses = root.querySelectorAll('use[href*=".svg#"], use[xlink\\:href*=".svg#"]');
    if (!uses.length) {
      return;
    }

    const spriteUrls = [
      ...new Set(
        [...uses]
          .map(useHref)
          .filter(Boolean)
          .map((href) => href.split("#")[0]),
      ),
    ];

    await Promise.all(spriteUrls.map((url) => loadSprite(url)));

    for (const use of uses) {
      const href = useHref(use);
      if (!href || !href.includes(".svg#")) {
        continue;
      }

      const [url, iconId] = href.split("#");
      const prefix = spritePrefixes.get(url);
      if (!prefix || !iconId) {
        continue;
      }

      const symbolId = `${prefix}-${iconId}`;
      setUseHref(use, `#${symbolId}`);

      const svg = use.closest("svg");
      const symbol = document.getElementById(symbolId);

      if (svg && symbol && !svg.getAttribute("viewBox")) {
        svg.setAttribute("viewBox", symbol.getAttribute("viewBox") || "0 0 512 512");
      }
    }
  }

  const ready = (document.readyState === "loading"
    ? new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }))
    : Promise.resolve()
  ).then(() => upgrade());

  window.faSprites = {
    ready,
    upgrade,
  };
})();
