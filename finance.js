/**
 * Campus Helper — Finance Tracker Module
 * Handles student budget, category limits with animated progress bars, and expense logs.
 */

const FinanceModule = {
    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        const form = document.getElementById('form-add-expense');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogExpense(e.target);
            });
        }

        const filterCategory = document.getElementById('finance-filter-category');
        if (filterCategory) {
            filterCategory.addEventListener('change', (e) => {
                this.renderTransactions(e.target.value);
            });
        }

        const resetBtn = document.getElementById('btn-reset-finance');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset budget and transactions to default demo data?')) {
                    Store.set(STORAGE_KEYS.FINANCE, DEFAULT_FINANCE);
                    App.playSound('pop');
                    App.showToast('Finance Reset', 'Restored initial student demo budget.', 'info');
                    this.render();
                    if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
                }
            });
        }
    },

    getFinanceData() {
        return Store.get(STORAGE_KEYS.FINANCE, DEFAULT_FINANCE);
    },

    saveFinanceData(data) {
        Store.set(STORAGE_KEYS.FINANCE, data);
        this.render();
        if (typeof DashboardModule !== 'undefined') DashboardModule.renderStats();
    },

    handleLogExpense(form) {
        const title = form.expenseTitle.value.trim();
        const amount = parseFloat(form.expenseAmount.value);
        const category = form.expenseCategory.value;
        const dateInput = form.expenseDate ? form.expenseDate.value : '';

        if (!title || isNaN(amount) || amount <= 0) {
            App.showToast('Invalid Amount', 'Please provide a valid expense title and positive dollar amount.', 'warning');
            return;
        }

        const finance = this.getFinanceData();
        const now = new Date();
        const dateFormatted = dateInput ? new Date(dateInput).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newTx = {
            id: 'tx_' + Date.now(),
            desc: title,
            amount: amount,
            category: category,
            date: dateFormatted
        };

        // Update category spent
        if (finance.categories[category]) {
            finance.categories[category].spent = parseFloat((finance.categories[category].spent + amount).toFixed(2));
        }

        finance.transactions.unshift(newTx);
        this.saveFinanceData(finance);

        form.reset();
        App.playSound('chime');
        App.showToast('Expense Logged', `Recorded $${amount.toFixed(2)} for ${title}. Budget updated!`, 'success');
    },

    deleteTransaction(txId) {
        const finance = this.getFinanceData();
        const txIndex = finance.transactions.findIndex(t => t.id === txId);
        if (txIndex !== -1) {
            const tx = finance.transactions[txIndex];
            // Subtract from category
            if (finance.categories[tx.category]) {
                finance.categories[tx.category].spent = Math.max(0, parseFloat((finance.categories[tx.category].spent - tx.amount).toFixed(2)));
            }
            finance.transactions.splice(txIndex, 1);
            this.saveFinanceData(finance);
            App.playSound('pop');
            App.showToast('Transaction Removed', 'Budget recalculated.', 'info');
        }
    },

    render() {
        const finance = this.getFinanceData();
        const totalBudget = finance.budget || 800.00;
        
        // Sum spent across all categories
        let totalSpent = 0;
        Object.values(finance.categories).forEach(cat => {
            totalSpent += cat.spent;
        });
        totalSpent = parseFloat(totalSpent.toFixed(2));
        const remaining = parseFloat((totalBudget - totalSpent).toFixed(2));
        const percentageUsed = Math.min(100, Math.round((totalSpent / totalBudget) * 100));

        // Estimate safe daily spend for remaining days in month (approx 15 days)
        const daysLeftInMonth = 16;
        const dailySafe = remaining > 0 ? (remaining / daysLeftInMonth).toFixed(2) : '0.00';

        // Render Top KPI Cards
        const totalBudgetEl = document.getElementById('finance-total-budget');
        const totalSpentEl = document.getElementById('finance-total-spent');
        const remainingEl = document.getElementById('finance-remaining');
        const dailySafeEl = document.getElementById('finance-daily-safe');
        const overallProgressBar = document.getElementById('finance-overall-progress');
        const overallPercentEl = document.getElementById('finance-overall-percentage');

        if (totalBudgetEl) totalBudgetEl.textContent = `$${totalBudget.toFixed(2)}`;
        if (totalSpentEl) totalSpentEl.textContent = `$${totalSpent.toFixed(2)}`;
        if (remainingEl) {
            remainingEl.textContent = `$${remaining.toFixed(2)}`;
            remainingEl.className = remaining < 100 ? 'text-coral neon-glow-coral' : 'text-emerald neon-glow-emerald';
        }
        if (dailySafeEl) dailySafeEl.textContent = `$${dailySafe}/day`;

        if (overallProgressBar) {
            overallProgressBar.style.width = `${percentageUsed}%`;
            if (percentageUsed >= 90) {
                overallProgressBar.className = 'progress-fill-bar bar-danger';
            } else if (percentageUsed >= 75) {
                overallProgressBar.className = 'progress-fill-bar bar-warning';
            } else {
                overallProgressBar.className = 'progress-fill-bar bar-cyan';
            }
        }
        if (overallPercentEl) {
            overallPercentEl.textContent = `${percentageUsed}% utilized`;
        }

        // Render Category Progress Bars
        this.renderCategories(finance.categories);

        // Render Transactions List
        const filterVal = document.getElementById('finance-filter-category')?.value || 'all';
        this.renderTransactions(filterVal);
    },

    renderCategories(categories) {
        const container = document.getElementById('finance-category-bars');
        if (!container) return;

        container.innerHTML = '';
        Object.entries(categories).forEach(([key, cat]) => {
            const pct = Math.min(100, Math.round((cat.spent / cat.budget) * 100));
            const isWarning = pct >= 80 && pct < 95;
            const isDanger = pct >= 95;

            const card = document.createElement('div');
            card.className = `category-budget-item ${isDanger ? 'alert-danger-pulse' : ''}`;
            card.innerHTML = `
                <div class="cat-bar-header">
                    <div class="cat-title-group">
                        <span class="cat-dot dot-${cat.color}"></span>
                        <span class="cat-name">${cat.name}</span>
                        ${isDanger ? '<span class="budget-warn-tag red">Limit Reached</span>' : isWarning ? '<span class="budget-warn-tag amber">Near Cap</span>' : ''}
                    </div>
                    <div class="cat-amounts">
                        <span class="cat-spent text-white">$${cat.spent.toFixed(2)}</span>
                        <span class="cat-limit text-muted">/ $${cat.budget.toFixed(2)}</span>
                        <span class="cat-pct text-muted">(${pct}%)</span>
                    </div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill-bar bar-${cat.color}" style="width: ${pct}%"></div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    renderTransactions(filter) {
        const container = document.getElementById('finance-transactions-list');
        if (!container) return;

        const finance = this.getFinanceData();
        let txs = finance.transactions || [];

        if (filter && filter !== 'all') {
            txs = txs.filter(t => t.category === filter);
        }

        if (txs.length === 0) {
            container.innerHTML = `
                <div class="glass-panel text-center py-6 text-muted">
                    No transactions found for this filter.
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        txs.forEach(tx => {
            const cat = finance.categories[tx.category] || { name: tx.category, color: 'cyan' };
            const row = document.createElement('div');
            row.className = 'transaction-row glass-panel hover-lift';
            row.innerHTML = `
                <div class="tx-left">
                    <div class="tx-icon-box bg-${cat.color}">
                        ${this.getCategoryIcon(tx.category)}
                    </div>
                    <div class="tx-info">
                        <span class="tx-title">${tx.desc}</span>
                        <div class="tx-submeta">
                            <span class="badge-cat-tag ${cat.color}">${cat.name}</span>
                            <span class="tx-date">${tx.date}</span>
                        </div>
                    </div>
                </div>
                <div class="tx-right">
                    <span class="tx-amount ${tx.amount > 0 ? 'text-coral' : 'text-emerald'}">
                        ${tx.amount > 0 ? `-$${tx.amount.toFixed(2)}` : 'FREE / Waiver'}
                    </span>
                    <button class="btn-icon text-muted hover-red" title="Delete record" onclick="FinanceModule.deleteTransaction('${tx.id}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });
    },

    getCategoryIcon(catKey) {
        switch (catKey) {
            case 'food':
                return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`;
            case 'tech':
                return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
            case 'books':
                return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
            case 'transit':
                return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path><path d="M15 3v18"></path></svg>`;
            default:
                return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`;
        }
    }
};

if (typeof window !== 'undefined') {
    window.FinanceModule = FinanceModule;
}
