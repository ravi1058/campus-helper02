/**
 * Campus Helper — Study Hub Module
 * Manages study notes & repository, free student materials, circular progress rings,
 * and an interactive academic growth test / quiz runner.
 */

const StudyModule = {
    activeTab: 'notes',
    activeCourseFilter: 'all',
    quizState: {
        active: false,
        currentQuestionIndex: 0,
        score: 0,
        answers: [],
        timerInterval: null,
        secondsLeft: 180
    },

    init() {
        this.bindEvents();
        this.renderResources();
        this.renderCircularProgress();
    },

    bindEvents() {
        // Sub-tabs in Study Hub
        const tabBtns = document.querySelectorAll('.study-subtab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTab = btn.dataset.tab;
                App.playSound('click');
                this.switchSubTab(this.activeTab);
            });
        });

        // Course filter pills
        const filterPills = document.querySelectorAll('.course-filter-pill');
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.activeCourseFilter = pill.dataset.course;
                App.playSound('click');
                this.renderResources();
            });
        });

        // Search input
        const searchInput = document.getElementById('study-resource-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderResources(e.target.value.toLowerCase().trim());
            });
        }

        // Add Resource Form
        const addResourceForm = document.getElementById('form-add-resource');
        if (addResourceForm) {
            addResourceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddResource(e.target);
            });
        }

        // Start Test Button
        const startTestBtn = document.getElementById('btn-start-test');
        if (startTestBtn) {
            startTestBtn.addEventListener('click', () => {
                this.launchQuiz();
            });
        }
    },

    switchSubTab(tabName) {
        const sections = {
            notes: document.getElementById('study-section-notes'),
            materials: document.getElementById('study-section-materials'),
            growth: document.getElementById('study-section-growth')
        };

        Object.keys(sections).forEach(key => {
            if (sections[key]) {
                if (key === tabName) {
                    sections[key].classList.remove('hidden');
                    sections[key].classList.add('fade-in');
                } else {
                    sections[key].classList.add('hidden');
                    sections[key].classList.remove('fade-in');
                }
            }
        });

        if (tabName === 'growth') {
            this.renderCircularProgress();
        }
    },

    getResources() {
        return Store.get(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES);
    },

    renderResources(searchQuery = '') {
        const container = document.getElementById('study-resources-grid');
        if (!container) return;

        let resources = this.getResources();

        if (this.activeCourseFilter && this.activeCourseFilter !== 'all') {
            resources = resources.filter(r => r.course === this.activeCourseFilter);
        }

        if (searchQuery) {
            resources = resources.filter(r => 
                r.title.toLowerCase().includes(searchQuery) ||
                r.description.toLowerCase().includes(searchQuery) ||
                r.tags.some(t => t.toLowerCase().includes(searchQuery))
            );
        }

        if (resources.length === 0) {
            container.innerHTML = `
                <div class="col-span-full glass-panel text-center py-8 text-muted">
                    No study resources matching your criteria. Try another search or filter.
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        resources.forEach(res => {
            const card = document.createElement('div');
            card.className = 'resource-card glass-panel hover-lift';
            card.innerHTML = `
                <div class="res-top">
                    <div class="res-badge-group">
                        <span class="badge-course ${res.course}">${res.course}</span>
                        <span class="badge-type">${res.type}</span>
                    </div>
                    <span class="res-category text-muted">${res.category}</span>
                </div>
                <h4 class="res-title">${res.title}</h4>
                <p class="res-desc">${res.description}</p>
                <div class="res-tags">
                    ${res.tags.map(t => `<span class="res-tag">#${t}</span>`).join('')}
                </div>
                <div class="res-actions">
                    <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="btn-res-link hover-cyan">
                        <span>Open Resource</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                    <button class="btn-icon text-muted hover-cyan" title="Copy Link" onclick="StudyModule.copyResourceLink('${res.url}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button class="btn-icon text-muted hover-red" title="Remove" onclick="StudyModule.deleteResource('${res.id}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    copyResourceLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            App.playSound('chime');
            App.showToast('Link Copied!', 'Resource URL copied to clipboard.', 'success');
        }).catch(() => {
            App.showToast('Copied', url, 'info');
        });
    },

    deleteResource(id) {
        let resources = this.getResources();
        resources = resources.filter(r => r.id !== id);
        Store.set(STORAGE_KEYS.RESOURCES, resources);
        App.playSound('pop');
        App.showToast('Resource Removed', 'Item removed from study hub.', 'info');
        this.renderResources();
    },

    handleAddResource(form) {
        const title = form.resTitle.value.trim();
        const course = form.resCourse.value.trim();
        const type = form.resType.value;
        const category = form.resCategory.value;
        const url = form.resUrl.value.trim();
        const tagsRaw = form.resTags.value.trim();
        const description = form.resDesc.value.trim();

        if (!title || !url) {
            App.showToast('Missing Info', 'Resource title and URL are required.', 'warning');
            return;
        }

        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : ['General'];
        const resources = this.getResources();

        const newResource = {
            id: 'res_' + Date.now(),
            title,
            course,
            type,
            category,
            url,
            tags,
            description: description || 'Student added resource repository item.'
        };

        resources.unshift(newResource);
        Store.set(STORAGE_KEYS.RESOURCES, resources);

        App.closeModal('modal-add-resource');
        form.reset();
        App.playSound('success');
        App.showToast('Resource Added', `Added "${title}" to Study Hub.`, 'success');
        this.renderResources();
    },

    renderCircularProgress() {
        const skills = [
            { course: 'CS301 Algorithms & Complexity', pct: 88, level: 'Advanced', color: '#00f2fe' },
            { course: 'AI402 Neural Architectures', pct: 92, level: 'Mastery', color: '#a855f7' },
            { course: 'OS204 Concurrency & UNIX', pct: 74, level: 'Intermediate', color: '#00f5a0' },
            { course: 'MATH220 Matrix & High-Dim', pct: 81, level: 'Proficient', color: '#f59e0b' }
        ];

        const container = document.getElementById('study-circular-progress-grid');
        if (!container) return;

        container.innerHTML = '';
        skills.forEach(skill => {
            const radius = 42;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (skill.pct / 100) * circumference;

            const card = document.createElement('div');
            card.className = 'growth-dial-card glass-panel hover-lift';
            card.innerHTML = `
                <div class="circular-progress-wrap">
                    <svg class="progress-ring" width="110" height="110">
                        <circle class="ring-bg" stroke="rgba(255,255,255,0.06)" stroke-width="8" fill="transparent" r="${radius}" cx="55" cy="55"/>
                        <circle class="ring-indicator" stroke="${skill.color}" stroke-width="8" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" fill="transparent" r="${radius}" cx="55" cy="55"/>
                    </svg>
                    <div class="ring-center-content">
                        <span class="ring-pct" style="color: ${skill.color}">${skill.pct}%</span>
                        <span class="ring-tag text-muted">Mastery</span>
                    </div>
                </div>
                <div class="growth-details">
                    <h5 class="course-name">${skill.course}</h5>
                    <div class="growth-level-badge">
                        <span class="dot" style="background: ${skill.color}"></span>
                        <span>Level: ${skill.level}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /**
     * Interactive Academic Sprint Quiz Engine
     */
    launchQuiz() {
        this.quizState = {
            active: true,
            currentQuestionIndex: 0,
            score: 0,
            answers: [],
            secondsLeft: 180,
            timerInterval: null
        };

        App.openModal('modal-quiz');
        App.playSound('chime');
        this.renderQuizStep();
        this.startQuizTimer();
    },

    startQuizTimer() {
        if (this.quizState.timerInterval) clearInterval(this.quizState.timerInterval);

        const timerEl = document.getElementById('quiz-timer-display');
        this.quizState.timerInterval = setInterval(() => {
            this.quizState.secondsLeft--;
            if (timerEl) {
                const mins = Math.floor(this.quizState.secondsLeft / 60);
                const secs = this.quizState.secondsLeft % 60;
                timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }

            if (this.quizState.secondsLeft <= 0) {
                clearInterval(this.quizState.timerInterval);
                this.finishQuiz();
            }
        }, 1000);
    },

    renderQuizStep() {
        const qIndex = this.quizState.currentQuestionIndex;
        const total = QUIZ_QUESTIONS.length;
        const container = document.getElementById('quiz-modal-body');
        if (!container) return;

        if (qIndex >= total) {
            this.finishQuiz();
            return;
        }

        const q = QUIZ_QUESTIONS[qIndex];
        const progressPct = ((qIndex) / total) * 100;

        container.innerHTML = `
            <div class="quiz-header-bar">
                <span class="quiz-step-label">Question ${qIndex + 1} of ${total}</span>
                <span class="badge-course ${q.course}">${q.course}</span>
            </div>
            <div class="quiz-progress-track">
                <div class="quiz-progress-fill" style="width: ${progressPct}%"></div>
            </div>
            <div class="quiz-question-box">
                <h4 class="quiz-question-text">${q.question}</h4>
            </div>
            <div class="quiz-options-grid" id="quiz-options-list">
                ${q.options.map((opt) => `
                    <button class="quiz-opt-btn" onclick="StudyModule.handleSelectOption('${opt.id}', ${!!opt.correct})">
                        <span class="opt-letter">${opt.id}</span>
                        <span class="opt-text">${opt.text}</span>
                    </button>
                `).join('')}
            </div>
            <div id="quiz-explanation-box" class="quiz-explanation hidden"></div>
        `;
    },

    handleSelectOption(optionId, isCorrect) {
        const qIndex = this.quizState.currentQuestionIndex;
        const q = QUIZ_QUESTIONS[qIndex];

        // Disable all option buttons
        const btns = document.querySelectorAll('.quiz-opt-btn');
        btns.forEach(b => {
            b.disabled = true;
            b.classList.add('disabled');
        });

        const chosenBtn = [...btns].find(b => b.querySelector('.opt-letter').textContent === optionId);
        
        if (isCorrect) {
            this.quizState.score++;
            App.playSound('success');
            if (chosenBtn) chosenBtn.classList.add('correct');
        } else {
            App.playSound('error');
            if (chosenBtn) chosenBtn.classList.add('incorrect');
            // Highlight correct one
            const correctOpt = q.options.find(o => o.correct);
            const correctBtn = [...btns].find(b => b.querySelector('.opt-letter').textContent === correctOpt.id);
            if (correctBtn) correctBtn.classList.add('correct');
        }

        // Show explanation and next button
        const expBox = document.getElementById('quiz-explanation-box');
        if (expBox) {
            expBox.className = 'quiz-explanation active fade-in';
            expBox.innerHTML = `
                <div class="exp-content">
                    <strong>${isCorrect ? '✅ Spot on!' : '❌ Incorrect'}</strong>
                    <p class="mt-1">${q.explanation}</p>
                </div>
                <button class="btn-primary mt-3" onclick="StudyModule.nextQuestion()">
                    ${qIndex + 1 < QUIZ_QUESTIONS.length ? 'Next Question →' : 'Complete Sprint Test 🚀'}
                </button>
            `;
        }
    },

    nextQuestion() {
        this.quizState.currentQuestionIndex++;
        App.playSound('click');
        this.renderQuizStep();
    },

    finishQuiz() {
        if (this.quizState.timerInterval) clearInterval(this.quizState.timerInterval);

        const container = document.getElementById('quiz-modal-body');
        if (!container) return;

        const score = this.quizState.score;
        const total = QUIZ_QUESTIONS.length;
        const pct = Math.round((score / total) * 100);

        App.playSound('chime');
        App.showToast('Academic Sprint Completed!', `Scored ${score}/${total} (${pct}%). Academic growth logged!`, 'success');

        container.innerHTML = `
            <div class="quiz-results-view text-center py-6">
                <div class="result-trophy-pulse">🏆</div>
                <h3 class="result-title text-glow-cyan">Sprint Test Finished!</h3>
                <p class="text-muted">You answered ${score} out of ${total} questions correctly.</p>
                
                <div class="score-display-card glass-panel my-4">
                    <span class="score-number">${pct}%</span>
                    <span class="score-remark">${pct >= 80 ? 'Mastery Level Achieved! 🌟' : pct >= 60 ? 'Solid Comprehension! 👍' : 'Review Recommended 📚'}</span>
                </div>

                <div class="quiz-xp-gained">
                    <span class="xp-badge">+${score * 20} Academic Growth XP</span>
                </div>

                <div class="result-actions mt-6">
                    <button class="btn-primary" onclick="App.closeModal('modal-quiz'); StudyModule.switchSubTab('growth');">
                        View Growth Dashboard
                    </button>
                    <button class="btn-secondary ml-3" onclick="StudyModule.launchQuiz()">
                        Retake Sprint
                    </button>
                </div>
            </div>
        `;
    }
};

if (typeof window !== 'undefined') {
    window.StudyModule = StudyModule;
}
