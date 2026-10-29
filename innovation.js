/**
 * Campus Helper — Innovation & Work Section Module
 * Interactive Kanban Board for student project sparks, hackathon ideas, and startup ventures.
 */

const InnovationModule = {
    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        // Add Idea button
        const addBtn = document.getElementById('btn-add-idea');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                App.openModal('modal-add-idea');
            });
        }

        // Add Idea Form
        const addForm = document.getElementById('form-add-idea');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateIdea(e.target);
            });
        }

        // Search input
        const searchInput = document.getElementById('innovation-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.render(e.target.value.toLowerCase().trim());
            });
        }
    },

    getIdeas() {
        return Store.get(STORAGE_KEYS.IDEAS, DEFAULT_IDEAS);
    },

    saveIdeas(ideas) {
        Store.set(STORAGE_KEYS.IDEAS, ideas);
        this.render();
    },

    render(searchQuery = '') {
        let ideas = this.getIdeas();

        if (searchQuery) {
            ideas = ideas.filter(idea => 
                idea.title.toLowerCase().includes(searchQuery) ||
                idea.description.toLowerCase().includes(searchQuery) ||
                idea.tags.some(t => t.toLowerCase().includes(searchQuery))
            );
        }

        const colIdeation = ideas.filter(i => i.column === 'ideation');
        const colProgress = ideas.filter(i => i.column === 'progress');
        const colReady = ideas.filter(i => i.column === 'ready');

        // Update counts
        const countAllEl = document.getElementById('count-ideas-all');
        const countIdeationEl = document.getElementById('count-ideas-ideation');
        const countProgressEl = document.getElementById('count-ideas-progress');
        const countReadyEl = document.getElementById('count-ideas-ready');

        if (countAllEl) countAllEl.textContent = ideas.length;
        if (countIdeationEl) countIdeationEl.textContent = colIdeation.length;
        if (countProgressEl) countProgressEl.textContent = colProgress.length;
        if (countReadyEl) countReadyEl.textContent = colReady.length;

        // Render each column
        this.renderColumn('kanban-col-ideation', colIdeation, 'ideation');
        this.renderColumn('kanban-col-progress', colProgress, 'progress');
        this.renderColumn('kanban-col-ready', colReady, 'ready');
    },

    renderColumn(containerId, columnIdeas, columnKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (columnIdeas.length === 0) {
            container.innerHTML = `
                <div class="empty-column-placeholder">
                    <span>No sparks in this stage yet.</span>
                </div>
            `;
            return;
        }

        columnIdeas.forEach(idea => {
            const card = document.createElement('div');
            card.className = `kanban-card glass-panel hover-lift priority-${idea.priority || 'medium'}`;
            card.innerHTML = `
                <div class="k-card-header">
                    <span class="badge-priority ${idea.priority || 'medium'}">${idea.priority || 'Medium'}</span>
                    <div class="k-actions-top">
                        <button class="btn-micro-icon text-muted hover-cyan" title="Upvote Idea" onclick="InnovationModule.upvoteIdea('${idea.id}')">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span class="upvote-count">${idea.upvotes || 0}</span>
                        </button>
                        <button class="btn-micro-icon text-muted hover-red" title="Delete" onclick="InnovationModule.deleteIdea('${idea.id}')">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <h4 class="k-card-title">${idea.title}</h4>
                <p class="k-card-desc">${idea.description}</p>
                <div class="k-card-tags">
                    ${(idea.tags || []).map(t => `<span class="k-tag">${t}</span>`).join('')}
                </div>
                <div class="k-card-footer">
                    <span class="k-card-date text-muted">${idea.date || 'Active'}</span>
                    <div class="k-move-buttons">
                        ${columnKey !== 'ideation' ? `
                            <button class="btn-move-step prev" title="Move back" onclick="InnovationModule.moveIdea('${idea.id}', 'prev')">
                                ←
                            </button>
                        ` : ''}
                        ${columnKey !== 'ready' ? `
                            <button class="btn-move-step next" title="Advance stage" onclick="InnovationModule.moveIdea('${idea.id}', 'next')">
                                →
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    moveIdea(id, direction) {
        const ideas = this.getIdeas();
        const idea = ideas.find(i => i.id === id);
        if (!idea) return;

        const stages = ['ideation', 'progress', 'ready'];
        const currentIndex = stages.indexOf(idea.column);

        if (direction === 'next' && currentIndex < stages.length - 1) {
            idea.column = stages[currentIndex + 1];
            App.playSound('chime');
            App.showToast('Spark Advanced!', `"${idea.title}" moved to ${idea.column.toUpperCase()}.`, 'success');
        } else if (direction === 'prev' && currentIndex > 0) {
            idea.column = stages[currentIndex - 1];
            App.playSound('pop');
            App.showToast('Spark Moved Back', `"${idea.title}" shifted stage.`, 'info');
        }

        this.saveIdeas(ideas);
    },

    upvoteIdea(id) {
        const ideas = this.getIdeas();
        const idea = ideas.find(i => i.id === id);
        if (idea) {
            idea.upvotes = (idea.upvotes || 0) + 1;
            App.playSound('chime');
            this.saveIdeas(ideas);
        }
    },

    deleteIdea(id) {
        let ideas = this.getIdeas();
        ideas = ideas.filter(i => i.id !== id);
        App.playSound('pop');
        App.showToast('Spark Deleted', 'Idea removed from board.', 'info');
        this.saveIdeas(ideas);
    },

    handleCreateIdea(form) {
        const title = form.ideaTitle.value.trim();
        const desc = form.ideaDesc.value.trim();
        const tagsRaw = form.ideaTags.value.trim();
        const priority = form.ideaPriority.value;
        const column = form.ideaColumn.value;

        if (!title || !desc) {
            App.showToast('Missing Details', 'Please enter a spark title and description.', 'warning');
            return;
        }

        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : ['Innovation'];
        const ideas = this.getIdeas();

        const newIdea = {
            id: 'idea_' + Date.now(),
            title,
            description: desc,
            column,
            tags,
            priority,
            date: 'Today',
            upvotes: 1
        };

        ideas.unshift(newIdea);
        this.saveIdeas(ideas);

        App.closeModal('modal-add-idea');
        form.reset();
        App.playSound('success');
        App.showToast('New Spark Logged!', `"${title}" added to ${column.toUpperCase()}.`, 'success');
    }
};

if (typeof window !== 'undefined') {
    window.InnovationModule = InnovationModule;
}
