(function () {
  const searchInput = document.getElementById("icons-search");
  const weightSelect = document.getElementById("icons-weight");
  const grid = document.getElementById("icons-grid");
  const status = document.getElementById("icons-status");

  if (!searchInput || !weightSelect || !grid || !status) {
    return;
  }

  const MAX_RESULTS = 200;
  let manifest = null;
  let filteredIcons = [];

  function spritePath(weight) {
    return manifest.weights[weight];
  }

  function iconMarkup(icon, weight) {
    const sprite = spritePath(weight);
    const viewBox = icon.viewBoxes[weight] || "0 0 512 512";

    return `<svg class="fa-icon icons-reference__icon" viewBox="${viewBox}" aria-hidden="true">
  <use href="${sprite}#${icon.id}"></use>
</svg>`;
  }

  function snippet(icon, weight) {
    const sprite = spritePath(weight);
    const viewBox = icon.viewBoxes[weight] || "0 0 512 512";

    return `<svg class="fa-icon" viewBox="${viewBox}" aria-hidden="true">
  <use href="${sprite}#${icon.id}"></use>
</svg>`;
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const weight = weightSelect.value;

    filteredIcons = manifest.icons.filter((icon) => icon.id.includes(query)).slice(0, MAX_RESULTS);

    grid.innerHTML = filteredIcons
      .map(
        (icon) => `
        <button
          type="button"
          class="icons-reference__item"
          role="listitem"
          data-icon-id="${icon.id}"
          title="Click to copy markup"
        >
          ${iconMarkup(icon, weight)}
          <span class="icons-reference__label">${icon.id}</span>
        </button>
      `,
      )
      .join("");

    window.faSprites?.upgrade(grid);

    const totalMatches = manifest.icons.filter((icon) => icon.id.includes(query)).length;
    const suffix =
      totalMatches > MAX_RESULTS ? ` (showing first ${MAX_RESULTS})` : "";

    status.textContent = `${totalMatches.toLocaleString()} icon${
      totalMatches === 1 ? "" : "s"
    }${suffix}`;
  }

  grid.addEventListener("click", async (event) => {
    const item = event.target.closest("[data-icon-id]");
    if (!item) {
      return;
    }

    const icon = manifest.icons.find((entry) => entry.id === item.dataset.iconId);
    if (!icon) {
      return;
    }

    const weight = weightSelect.value;

    try {
      await copyText(snippet(icon, weight));
      item.classList.add("is-copied");
      window.setTimeout(() => item.classList.remove("is-copied"), 1200);
    } catch (error) {
      console.error("Could not copy icon markup", error);
    }
  });

  searchInput.addEventListener("input", render);
  weightSelect.addEventListener("change", render);

  fetch("icons.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load icons.json (${response.status})`);
      }

      return response.json();
    })
    .then((data) => {
      manifest = data;
      render();
    })
    .catch((error) => {
      status.textContent = "Could not load icon manifest.";
      console.error(error);
    });
})();
