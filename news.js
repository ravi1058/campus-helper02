/**
 * Campus Helper — News & Opportunities Feed Module
 * Displays hackathons, student tech jobs/internships, research grants, and campus demos.
 */

const NewsModule = {
    activeCategory: 'all',
    activeSearch: '',

    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        // Category filter chips
        const filterChips = document.querySelectorAll('.opp-filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.dataset.category;
                App.playSound('click');
                this.render();
            });
        });

        // Search input
        const searchInput = document.getElementById('opp-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.activeSearch = e.target.value.toLowerCase().trim();
                this.render();
            });
        }
    },

    getOpportunities() {
        return Store.get(STORAGE_KEYS.OPPORTUNITIES, DEFAULT_OPPORTUNITIES);
    },

    saveOpportunities(opps) {
        Store.set(STORAGE_KEYS.OPPORTUNITIES, opps);
        this.render();
    },

    toggleBookmark(id) {
        const opps = this.getOpportunities();
        const opp = opps.find(o => o.id === id);
        if (opp) {
            opp.bookmarked = !opp.bookmarked;
            this.saveOpportunities(opps);
            App.playSound('chime');
            App.showToast(
                opp.bookmarked ? 'Saved to Bookmarks' : 'Removed from Bookmarks',
                `"${opp.title}" updated in your collection.`,
                opp.bookmarked ? 'success' : 'info'
            );
        }
    },

    openApplyModal(id) {
        const opps = this.getOpportunities();
        const opp = opps.find(o => o.id === id);
        if (!opp) return;

        const modalBody = document.getElementById('modal-apply-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="apply-header mb-4">
                    <span class="badge-opp-category ${opp.category}">${opp.category.toUpperCase()}</span>
                    <h3 class="modal-title-glow mt-2">${opp.title}</h3>
                    <p class="text-cyan font-semibold">${opp.org} • ${opp.type}</p>
                </div>

                <div class="apply-perks-grid glass-panel p-4 mb-4">
                    <div class="perk-item">
                        <span class="perk-label text-muted">Compensation / Prize</span>
                        <span class="perk-val text-emerald font-bold">${opp.stipend}</span>
                    </div>
                    <div class="perk-item">
                        <span class="perk-label text-muted">Application Deadline</span>
                        <span class="perk-val text-amber font-bold">${opp.deadline}</span>
                    </div>
                </div>

                <div class="apply-desc mb-4">
                    <h5 class="text-white mb-2">Program Overview</h5>
                    <p class="text-muted leading-relaxed">${opp.description}</p>
                </div>

                <div class="apply-checklist glass-panel p-4 mb-5">
                    <h5 class="text-white mb-3">Applicant Checklist</h5>
                    <ul class="checklist-items">
                        <li>✔️ Up-to-date Student Resume (PDF)</li>
                        <li>✔️ GitHub or Portfolio URL demonstrating 2+ projects</li>
                        <li>✔️ Current Unofficial Transcript (Min. GPA 3.0)</li>
                        <li>✔️ Statement of Interest (250 words)</li>
                    </ul>
                </div>

                <div class="apply-actions flex gap-3 justify-end">
                    <button class="btn-secondary" onclick="App.closeModal('modal-apply')">Close</button>
                    <button class="btn-primary" onclick="NewsModule.simulateSubmission('${opp.id}')">
                        Submit Quick Application 🚀
                    </button>
                </div>
            `;
        }
        App.openModal('modal-apply');
    },

    simulateSubmission(id) {
        App.closeModal('modal-apply');
        App.playSound('success');
        App.showToast('Application Submitted!', 'Your profile was submitted to the reviewer portal. Good luck!', 'success');
    },

    render() {
        const container = document.getElementById('news-opportunities-feed');
        if (!container) return;

        let opps = this.getOpportunities();

        if (this.activeCategory !== 'all') {
            if (this.activeCategory === 'bookmarked') {
                opps = opps.filter(o => o.bookmarked);
            } else {
                opps = opps.filter(o => o.category === this.activeCategory);
            }
        }

        if (this.activeSearch) {
            opps = opps.filter(o => 
                o.title.toLowerCase().includes(this.activeSearch) ||
                o.org.toLowerCase().includes(this.activeSearch) ||
                o.description.toLowerCase().includes(this.activeSearch) ||
                o.tags.some(t => t.toLowerCase().includes(this.activeSearch))
            );
        }

        if (opps.length === 0) {
            container.innerHTML = `
                <div class="glass-panel text-center py-10 text-muted">
                    No student opportunities matching your criteria.
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        opps.forEach(opp => {
            const card = document.createElement('div');
            card.className = `opp-card glass-panel hover-lift urgency-${opp.urgency || 'medium'}`;
            card.innerHTML = `
                <div class="opp-top-row">
                    <div class="opp-category-badge-group">
                        <span class="badge-opp-category ${opp.category}">${opp.category.toUpperCase()}</span>
                        <span class="opp-org">${opp.org}</span>
                    </div>
                    <button class="btn-bookmark ${opp.bookmarked ? 'bookmarked' : ''}" title="${opp.bookmarked ? 'Remove bookmark' : 'Bookmark'}" onclick="NewsModule.toggleBookmark('${opp.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="${opp.bookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                </div>
                
                <h3 class="opp-title">${opp.title}</h3>
                <p class="opp-desc">${opp.description}</p>

                <div class="opp-meta-grid">
                    <div class="opp-meta-item">
                        <span class="meta-label">Award / Stipend:</span>
                        <span class="meta-val text-emerald">${opp.stipend}</span>
                    </div>
                    <div class="opp-meta-item">
                        <span class="meta-label">Deadline:</span>
                        <span class="meta-val text-amber">${opp.deadline}</span>
                    </div>
                </div>

                <div class="opp-tags-row">
                    ${opp.tags.map(t => `<span class="opp-tag">#${t}</span>`).join('')}
                </div>

                <div class="opp-footer">
                    <span class="opp-type text-muted">${opp.type}</span>
                    <div class="opp-actions">
                        <a href="${opp.link}" target="_blank" rel="noopener noreferrer" class="btn-text-link">
                            Official Site ↗
                        </a>
                        <button class="btn-primary btn-sm glow-btn-cyan" onclick="NewsModule.openApplyModal('${opp.id}')">
                            Apply / Review
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
};

if (typeof window !== 'undefined') {
    window.NewsModule = NewsModule;
}
