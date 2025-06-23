document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素获取
    const reportContentDiv = document.getElementById('report-content');
    const paginationContainer = document.getElementById('pagination-container');
    const manualKeywordsContainer = document.getElementById('manual-keywords-display');
    const hotKeywordsContainer = document.getElementById('hot-keywords-display');
    const updateCountBadge = document.getElementById('update-count-badge');
    const currentYearSpan = document.getElementById('current-year');
    
    // 常量
    const LAST_VIEWED_UPDATE_KEY = 'lastViewedUpdateTime';
    
    // 状态
    let intersectionObserver;

    // 渲染结构化解读的函数
    function renderInterpretation(interpretation) {
        if (typeof interpretation !== 'object' || interpretation === null) {
            return `<p class="poster-interpretation-subsection">${interpretation || '暂无深入解读。'}</p>`;
        }
        const fieldTitles = {
            core_contribution: '核心贡献与创新', methodology_summary: '方法总结',
            performance_evaluation: '性能评估', inferred_application: '应用推断',
            survey_scope: '综述范围', taxonomy_or_structure: '分类体系与结构',
            key_trends_and_insights: '关键趋势与洞见', target_audience: '目标读者'
        };
        let html = '';
        for (const key in interpretation) {
            if (Object.hasOwnProperty.call(interpretation, key) && interpretation[key]) {
                const title = fieldTitles[key] || key.replace(/_/g, ' ');
                html += `<div class="poster-interpretation-subsection mb-3"><h5>${title}</h5><p>${interpretation[key]}</p></div>`;
            }
        }
        return html || '<p class="poster-interpretation-subsection">暂无深入解读。</p>';
    }

    // 卡片滑动交互逻辑
    function setupIntersectionObserver() {
        const cards = document.querySelectorAll('.report-card-poster');
        if (cards.length === 0) return;
        if (intersectionObserver) { intersectionObserver.disconnect(); }
        const options = { root: reportContentDiv, rootMargin: '0px', threshold: 0.6 };
        intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    cards.forEach(c => c.classList.remove('is-active'));
                    entry.target.classList.add('is-active');
                    updatePaginationDots(Array.from(cards).indexOf(entry.target));
                }
            });
        }, options);
        cards.forEach(card => intersectionObserver.observe(card));
    }
    
    // 分页圆点渲染与更新
    function renderPaginationDots(totalCount) {
        paginationContainer.innerHTML = '';
        for (let i = 0; i < totalCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'pagination-dot';
            dot.dataset.index = i;
            dot.addEventListener('click', () => navigateToCard(i));
            paginationContainer.appendChild(dot);
        }
        updatePaginationDots(0);
    }
    
    function updatePaginationDots(activeIndex) {
        const dots = paginationContainer.querySelectorAll('.pagination-dot');
        dots.forEach((dot, index) => dot.classList.toggle('active', index === activeIndex));
    }

    function navigateToCard(index) {
        const cards = document.querySelectorAll('.report-card-poster');
        if (index >= 0 && index < cards.length) {
            cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
    
    // 主数据获取与渲染逻辑
    function renderPageData(data) {
        const { keywords, papers, lastUpdate } = data;
        const lastViewedTime = localStorage.getItem(LAST_VIEWED_UPDATE_KEY);

        // 渲染关键词
        if (keywords && keywords.manual) {
            manualKeywordsContainer.innerHTML = keywords.manual.map(k => `<span class="keyword-tag-display bg-sky-100 text-sky-700 text-sm font-medium px-3 py-1.5 rounded-full">${k}</span>`).join('');
        }
        if (keywords && keywords.hot) {
            hotKeywordsContainer.innerHTML = keywords.hot.map(k => `<span class="keyword-tag-display bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1.5 rounded-full">${k}</span>`).join('');
        }
        
        // 渲染论文卡片
        reportContentDiv.innerHTML = '';
        const papersToShow = papers ? papers.slice(0, 4) : [];
        let newPapersCount = 0;

        if (papersToShow.length === 0) {
            reportContentDiv.innerHTML = `<div class="w-full h-full flex items-center justify-center text-slate-600"><p>暂无精选论文。</p></div>`;
            renderPaginationDots(0);
            return;
        }

        papersToShow.forEach((paper) => {
            const card = document.createElement('article');
            card.className = 'report-card-poster';
            card.style.position = 'relative';

            const isNew = lastUpdate && lastViewedTime && new Date(lastUpdate) > new Date(lastViewedTime);
            if (isNew) { newPapersCount++; }
            
            const authorsHtml = (paper.authors || []).join(', ');
            const keywordsHtml = (paper.paperKeywords || []).map(k => `<span class="bg-sky-100 text-sky-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">${k}</span>`).join('');
            const interpretationHtml = renderInterpretation(paper.interpretation);
            const snippetHtml = paper.snippet || "摘要信息不可用。";
            const titleHtml = paper.title || "标题不可用";
            const journalHtml = paper.journal || "N/A";
            const pubDateHtml = paper.publicationDate || "N/A";
            
            card.innerHTML = `<div class="poster-grid"><div class="poster-left-column"><div><h3 class="text-xl font-bold text-sky-800 mb-2">${titleHtml}</h3><p class="text-sm text-slate-600 mb-4"><strong>作者:</strong> ${authorsHtml}</p></div><div class="poster-journal-info mt-auto pt-4 border-t border-slate-300"><p><strong>期刊/来源:</strong> ${journalHtml}</p><p><strong>发表日期:</strong> ${pubDateHtml}</p></div></div><div class="poster-right-column"><h4 class="poster-section-title">摘要</h4><p class="text-slate-700 text-sm text-justify leading-relaxed mb-4">${snippetHtml}</p><h4 class="poster-section-title">关键词</h4><div class="flex flex-wrap gap-2 my-2">${keywordsHtml}</div><h4 class="poster-section-title">深入解读</h4><div class="poster-interpretation mt-2 flex-grow overflow-y-auto pr-2">${interpretationHtml}</div><footer class="mt-auto pt-4">${paper.url && paper.url !== "#" ? `<a href="${paper.url}" target="_blank" rel="noopener noreferrer" class="block w-full text-center bg-sky-600 text-white font-semibold py-2 rounded-lg hover:bg-sky-700 transition">阅读原文 &rarr;</a>` : ''}</footer></div></div>`;
            
            if (isNew) {
                const newBadge = document.createElement('div');
                newBadge.className = 'paper-card-new-badge';
                newBadge.textContent = 'New';
                card.appendChild(newBadge);
            }
            reportContentDiv.appendChild(card);
        });
        
        if (newPapersCount > 0) {
            updateCountBadge.textContent = `有新内容`;
            updateCountBadge.classList.remove('hidden');
        }

        renderPaginationDots(papersToShow.length);
        setupIntersectionObserver();
        
        setTimeout(() => {
            const firstCard = reportContentDiv.querySelector('.report-card-poster');
            if (firstCard) { firstCard.classList.add('is-active'); }
        }, 100);

        if (lastUpdate) {
          localStorage.setItem(LAST_VIEWED_UPDATE_KEY, lastUpdate);
        }
    }

    // --- 初始化 App ---
    fetch('academic_data.json?t=' + new Date().getTime())
        .then(response => {
            if (!response.ok) { throw new Error(`Network response was not ok: ${response.statusText}`); }
            return response.json();
        })
        .then(data => {
            renderPageData(data);
        })
        .catch(error => {
            console.error('Error fetching or processing data:', error);
            reportContentDiv.innerHTML = `<div class="w-full h-full flex items-center justify-center text-red-600"><p>❌ 加载数据失败，请检查 academic_data.json 文件是否存在或格式是否正确。</p></div>`;
        });
    
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});