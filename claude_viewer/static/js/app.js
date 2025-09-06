// Claude Code Viewer JavaScript

class ClaudeViewer {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCodeCopyButtons();
        this.setupSearch();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Search form
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Clear filters
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }

        // Auto-submit on filter change
        const filters = document.querySelectorAll('.auto-filter');
        filters.forEach(filter => {
            filter.addEventListener('change', () => this.autoSubmitFilters());
        });

        // Check oversized messages
        const checkOversizedBtn = document.getElementById('check-oversized-btn');
        if (checkOversizedBtn) {
            checkOversizedBtn.addEventListener('click', () => this.checkOversizedMessages());
        }
    }

    setupCodeCopyButtons() {
        // Add copy buttons to all code blocks and pre elements
        const codeElements = document.querySelectorAll('.code-block, .message-content pre');
        
        codeElements.forEach(block => {
            // Skip if copy button already exists
            if (block.querySelector('.copy-btn')) return;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = () => this.copyCode(block);
            
            // Make block relative positioned
            block.style.position = 'relative';
            block.appendChild(copyBtn);
        });
    }

    setupSearch() {
        // Setup search input with debounce
        const searchInput = document.getElementById('search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (e.target.value.length > 2 || e.target.value.length === 0) {
                        this.autoSubmitFilters();
                    }
                }, 500);
            });
        }
    }

    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    }

    copyCode(codeBlock) {
        // Get the code content - handle both .code-block and direct pre elements
        let code;
        if (codeBlock.tagName === 'PRE') {
            code = codeBlock.textContent;
        } else {
            const preElement = codeBlock.querySelector('pre');
            code = preElement ? preElement.textContent : codeBlock.textContent;
        }
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                this.showCopyFeedback(codeBlock);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopyFeedback(codeBlock);
        }
    }

    showCopyFeedback(codeBlock) {
        const copyBtn = codeBlock.querySelector('.copy-btn');
        const originalText = copyBtn.textContent;
        
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = 'rgba(16, 185, 129, 0.2)';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }

    handleSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const params = new URLSearchParams();
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                params.append(key, value.trim());
            }
        }
        
        // Redirect with search parameters
        const url = new URL(window.location);
        url.search = params.toString();
        window.location.href = url.toString();
    }

    autoSubmitFilters() {
        const form = document.getElementById('search-form');
        if (form) {
            form.submit();
        }
    }

    clearFilters() {
        // Clear all form inputs
        const form = document.getElementById('search-form');
        if (form) {
            form.reset();
            
            // Remove URL parameters and redirect
            const url = new URL(window.location);
            url.search = '';
            window.location.href = url.toString();
        }
    }

    // Utility methods
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Search highlighting
    highlightSearchTerms(text, searchTerm) {
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Smooth scroll to element
    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Show loading state
    showLoading(element) {
        if (element) {
            element.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    Loading...
                </div>
            `;
        }
    }

    // Initialize pagination
    setupPagination() {
        const paginationLinks = document.querySelectorAll('.pagination .page-link');
        paginationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = new URL(link.href);
                this.loadPage(url.searchParams.get('page'));
            });
        });
    }

    loadPage(pageNumber) {
        const url = new URL(window.location);
        url.searchParams.set('page', pageNumber);
        window.location.href = url.toString();
    }

    // Oversized messages functionality
    async checkOversizedMessages() {
        const btn = document.getElementById('check-oversized-btn');
        const originalHtml = btn.innerHTML;
        
        // Show loading state
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>检查中...';
        btn.disabled = true;

        try {
            // Get project and session info from current URL
            const pathParts = window.location.pathname.split('/');
            const projectName = pathParts[2];
            const sessionId = pathParts[3];

            const response = await fetch(`/api/oversized-messages/${projectName}/${sessionId}?size_threshold=100000`);
            const data = await response.json();

            if (data.count > 0) {
                this.showOversizedMessages(data.oversized_messages);
            } else {
                this.showNoOversizedMessages();
            }

        } catch (error) {
            console.error('Error checking oversized messages:', error);
            this.showOversizedError(error.message);
        } finally {
            // Restore button state
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    showOversizedMessages(messages) {
        const alert = document.getElementById('oversized-alert');
        const details = document.getElementById('oversized-details');
        
        let html = `
            <p class="mb-3">发现 <strong>${messages.length}</strong> 个过大的消息可能导致上下文溢出：</p>
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>行号</th>
                            <th>大小</th>
                            <th>类型</th>
                            <th>预览</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        messages.forEach((msg, index) => {
            html += `
                <tr>
                    <td><code>${msg.line_number}</code></td>
                    <td><span class="badge bg-warning">${msg.size_mb} MB</span></td>
                    <td><span class="badge bg-secondary">${msg.role}</span></td>
                    <td class="text-truncate" style="max-width: 200px;" title="${msg.preview}">${msg.preview}</td>
                    <td>
                        <button 
                            class="btn btn-danger btn-sm" 
                            onclick="window.claudeViewer.confirmCleanupMessages(${msg.line_number})"
                            title="删除此消息及之后的所有消息"
                        >
                            <i class="bi bi-trash"></i>
                            清理
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    清理操作会删除选定行及其之后的所有消息，并创建备份文件
                </small>
            </div>
        `;

        details.innerHTML = html;
        alert.classList.remove('d-none');
    }

    showNoOversizedMessages() {
        const alert = document.getElementById('oversized-alert');
        const details = document.getElementById('oversized-details');
        
        alert.className = 'alert alert-success';
        details.innerHTML = `
            <h6 class="alert-heading">
                <i class="bi bi-check-circle-fill me-2"></i>
                检查完成
            </h6>
            <p class="mb-0">没有发现过大的消息。这个对话应该能正常加载。</p>
        `;
        alert.classList.remove('d-none');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alert.classList.add('d-none');
            alert.className = 'alert alert-warning d-none';
        }, 5000);
    }

    showOversizedError(errorMessage) {
        const alert = document.getElementById('oversized-alert');
        const details = document.getElementById('oversized-details');
        
        alert.className = 'alert alert-danger';
        details.innerHTML = `
            <h6 class="alert-heading">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                检查失败
            </h6>
            <p class="mb-0">无法检查过大消息: ${errorMessage}</p>
        `;
        alert.classList.remove('d-none');
    }

    async confirmCleanupMessages(fromLine) {
        const confirmed = confirm(
            `确定要删除第 ${fromLine} 行及其之后的所有消息吗？\n\n` +
            `这个操作不可逆转，但会创建备份文件。\n` +
            `删除后需要刷新页面查看结果。`
        );

        if (confirmed) {
            await this.cleanupMessages(fromLine);
        }
    }

    async cleanupMessages(fromLine) {
        try {
            // Get project and session info from current URL
            const pathParts = window.location.pathname.split('/');
            const projectName = pathParts[2];
            const sessionId = pathParts[3];

            const response = await fetch(`/api/cleanup-messages/${projectName}/${sessionId}?from_line=${fromLine}`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`清理成功！已删除第 ${fromLine} 行及其之后的消息。\n页面将重新加载以显示清理后的内容。`);
                window.location.reload();
            } else {
                throw new Error(result.detail || '清理失败');
            }

        } catch (error) {
            console.error('Error cleaning messages:', error);
            alert(`清理失败: ${error.message}`);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // Initialize the main app
    window.claudeViewer = new ClaudeViewer();
    
    // Setup pagination if present
    window.claudeViewer.setupPagination();
});

// Utility functions for templates
window.formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

window.formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
};