import MarkdownIt from "markdown-it";

document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.querySelector(".search-form-container form") as HTMLFormElement | null;
  const resultsSection = document.querySelector(".results-section") as HTMLElement | null;
  const resultsQueryText = document.getElementById("results-query-text") as HTMLElement | null;
  const synthaseContainer = document.getElementById("synthase-container") as HTMLElement | null;
  const iaContentPlaceholder = document.getElementById("ia-content-placeholder") as HTMLElement | null;
  const loader = document.getElementById("loader") as HTMLElement | null;

  const profileSelectorBtn = document.getElementById("profile-selector-btn") as HTMLButtonElement | null;
  const profileOptionsList = document.getElementById("profile-options") as HTMLUListElement | null;
  const selectedProfileText = document.getElementById("selected-profile-text") as HTMLSpanElement | null;

  const md = new MarkdownIt();

  const toggleDropdown = (show: boolean) => {
    if (!profileOptionsList || !profileSelectorBtn) return;
    profileOptionsList.hidden = !show;
    profileSelectorBtn.setAttribute("aria-expanded", String(show));
  };

  profileSelectorBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!profileSelectorBtn) return;
    const isExpanded = profileSelectorBtn.getAttribute("aria-expanded") === "true";
    toggleDropdown(!isExpanded);
  });

  const selectOption = (optionElement: HTMLElement) => {
    if (!selectedProfileText) return;
    selectedProfileText.textContent = optionElement.textContent ?? "";
    toggleDropdown(false);
    profileSelectorBtn?.focus();
  };

  profileOptionsList?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target?.tagName === "LI") selectOption(target);
  });

  profileOptionsList?.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    if ((event.key === "Enter" || event.key === " ") && target?.tagName === "LI") {
      event.preventDefault();
      selectOption(target);
    }
  });

  window.addEventListener("click", (event) => {
    if (!profileSelectorBtn) return;
    if (!profileSelectorBtn.contains(event.target as Node)) {
      if (profileSelectorBtn.getAttribute("aria-expanded") === "true") toggleDropdown(false);
    }
  });

  searchForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const searchInput = searchForm.querySelector('input[type="text"]') as HTMLInputElement | null;
    const query = searchInput?.value?.trim() ?? "";
    const profile = (selectedProfileText?.textContent ?? "").trim();

    if (!query || !profile) {
      alert("Veuillez entrer une question et sélectionner un profil.");
      return;
    }

    resultsSection?.classList.remove("hidden");
    if (synthaseContainer) synthaseContainer.hidden = true;
    if (loader) loader.hidden = false;
    if (resultsQueryText) resultsQueryText.textContent = "Recherche en cours…";
    if (iaContentPlaceholder) iaContentPlaceholder.innerHTML = "";

    try {
      const resp = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, profile })
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data: { answer: string } = await resp.json();
      const aiResponseText = data?.answer ?? "";

      if (loader) loader.hidden = true;
      if (synthaseContainer) synthaseContainer.hidden = false;

      const formattedQuery = query.length > 50 ? query.substring(0, 47) + "…" : query;
      if (resultsQueryText) resultsQueryText.textContent = `${formattedQuery}.`;

      if (iaContentPlaceholder) iaContentPlaceholder.innerHTML = md.render(aiResponseText);
    } catch (err: any) {
      if (loader) loader.hidden = true;
      if (synthaseContainer) synthaseContainer.hidden = false;
      if (resultsQueryText) resultsQueryText.textContent = `Erreur.`;
      if (iaContentPlaceholder) {
        iaContentPlaceholder.innerHTML = `
          <p style="color: red;"><strong>Impossible d'obtenir une réponse.</strong></p>
          <p>Détails : ${err?.message ?? "inconnu"}</p>
        `;
      }
    }
  });
});
