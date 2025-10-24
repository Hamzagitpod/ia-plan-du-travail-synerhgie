import { GoogleGenAI } from "@google/genai";
import MarkdownIt from 'markdown-it';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selections ---
    const searchForm = document.querySelector('.search-form-container form') as HTMLFormElement;
    const resultsSection = document.querySelector('.results-section') as HTMLElement;
    const resultsQueryText = document.getElementById('results-query-text') as HTMLElement;
    const synthaseContainer = document.getElementById('synthase-container') as HTMLElement;
    const iaContentPlaceholder = document.getElementById('ia-content-placeholder') as HTMLElement;
    const loader = document.getElementById('loader') as HTMLElement;
    
    const profileSelectorBtn = document.getElementById('profile-selector-btn') as HTMLButtonElement;
    const profileOptionsList = document.getElementById('profile-options') as HTMLUListElement;
    const selectedProfileText = document.getElementById('selected-profile-text') as HTMLSpanElement;

    // Initialisation du parser Markdown et du client Gemini
    const md = new MarkdownIt();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- Dropdown Logic ---
    const toggleDropdown = (show: boolean) => {
        profileOptionsList.hidden = !show;
        profileSelectorBtn.setAttribute('aria-expanded', String(show));
    };

    profileSelectorBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const isExpanded = profileSelectorBtn.getAttribute('aria-expanded') === 'true';
        toggleDropdown(!isExpanded);
    });

    const selectOption = (optionElement: HTMLElement) => {
        selectedProfileText.textContent = optionElement.textContent || '';
        toggleDropdown(false);
        profileSelectorBtn.focus();
    };

    profileOptionsList.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'LI') {
            selectOption(target);
        }
    });

    profileOptionsList.addEventListener('keydown', (event) => {
        const target = event.target as HTMLElement;
        if ((event.key === 'Enter' || event.key === ' ') && target.tagName === 'LI') {
            event.preventDefault();
            selectOption(target);
        }
    });

    window.addEventListener('click', (event) => {
        if (!profileSelectorBtn.contains(event.target as Node)) {
            if (profileSelectorBtn.getAttribute('aria-expanded') === 'true') {
                toggleDropdown(false);
            }
        }
    });
    
    // --- Form Submission Logic ---
    if (searchForm) {
        searchForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const searchInput = searchForm.querySelector('input[type="text"]') as HTMLInputElement;
            const query = searchInput.value;
            const profile = (selectedProfileText.textContent || '').trim();

            if (!query || !profile) {
                alert("Veuillez entrer une question et sélectionner un profil.");
                return;
            }

            console.log('Recherche Soumise:', { query, profile });

            // Show loading state
            resultsSection.classList.remove('hidden');
            synthaseContainer.hidden = true;
            loader.hidden = false;
            resultsQueryText.textContent = 'Recherche en cours...';
            iaContentPlaceholder.innerHTML = '';
            
            try {
                // Prompt Engineering : On guide l'IA pour obtenir de meilleurs résultats
                const systemInstruction = `
                    Vous êtes un expert de classe mondiale en droit du travail international et en mobilité professionnelle.
                    Votre rôle est de fournir des réponses précises, structurées et directement exploitables basées sur la question et le profil de l'utilisateur.
                    Mettez en évidence les points clés, les démarches administratives et les conseils pratiques.
                    La réponse doit être formulée en français.
                `;

                const userPrompt = `
                    En tant que "${profile}", je me pose la question suivante concernant le travail en Guinée : "${query}".

                    Fournissez une synthèse structurée qui aborde les points suivants si pertinents :
                    1.  **Visa et Permis de Travail :** Procédures, documents requis, délais estimés.
                    2.  **Marché du Travail :** Opportunités pour un profil de ${profile}, salaires moyens, secteurs porteurs.
                    3.  **Contrat de Travail :** Spécificités locales, points de vigilance.
                    4.  **Fiscalité :** Taux d'imposition sur le revenu, taxes locales.
                    5.  **Qualité de Vie :** Coût de la vie, logement, sécurité.
                    
                    Votre réponse doit être claire et facile à comprendre.
                `;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemInstruction,
                    }
                });

                const aiResponseText = response.text;
                
                // Update UI with the result
                loader.hidden = true;
                synthaseContainer.hidden = false;
                
                const formattedQuery = query.length > 50 ? query.substring(0, 47) + '...' : query;
                resultsQueryText.textContent = `${formattedQuery}.`;

                // Render the Markdown response from the AI as HTML
                iaContentPlaceholder.innerHTML = md.render(aiResponseText);

            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
                loader.hidden = true;
                synthaseContainer.hidden = false;
                resultsQueryText.textContent = `Erreur.`;
                iaContentPlaceholder.innerHTML = `
                    <p style="color: red;"><strong>Impossible de contacter le service d'IA.</strong></p>
                    <p>Veuillez vérifier votre connexion internet et que la clé API est correcte. Détails de l'erreur : ${(error as Error).message}</p>
                `;
            }
        });
    }
});