const App = {
  data: null,
  archive: [],
  activeCategory: 'all',

  async init() {
    await this.loadData();
    this.render();
    this.bindEvents();
  },

  async loadData() {
    try {
      const [latest, archive] = await Promise.all([
        fetch('data/latest.json').then(r => r.json()).catch(() => null),
        fetch('data/index.json').then(r => r.json()).catch(() => [])
      ]);
      this.data = latest;
      this.archive = Array.isArray(archive) ? archive : [];
    } catch (e) {
      this.data = null;
      this.archive = [];
    }
  },

  render() {
    if (!this.data) {
      document.getElementById('news-list').innerHTML =
        '<div class="loading">数据加载失败，请检查文件或稍后重试。</div>';
      return;
    }
    document.getElementById('brief-date').textContent = this.data.date || '未知';
    document.getElementById('generated-at').textContent = this.data.generated_at || '未知';
    this.renderStats();
    this.renderTrend();
    this.renderNews();
    this.renderArchive();
  },

  renderStats() {
    const s = this.data.stats || {};
    document.getElementById('stat-items').textContent = s.total_items || '—';
    document.getElementById('stat-companies').textContent = s.companies_covered || '—';
    document.getElementById('stat-density').textContent = s.highest_energy_density || '—';
  },

  renderTrend() {
    document.getElementById('trend-content').textContent =
      this.data.trend || '暂无趋势分析。';
  },

  renderNews() {
    const container = document.getElementById('news-list');
    const items = (this.data.items || []).filter(
      it => this.activeCategory === 'all' || it.category === this.activeCategory
    );

    if (items.length === 0) {
      container.innerHTML = '<div class="loading">该分类下暂无条目。</div>';
      return;
    }

    container.innerHTML = items.map(item => {
      const paramsHtml = Object.entries(item.params || {})
        .map(([k, v]) => `<span class="param-chip">${k}: ${v}</span>`)
        .join('');

      return `
        <article class="news-card">
          <div class="news-card-header">
            <span class="rank-num">${item.rank || ''}</span>
            <span class="tag-label">${item.tag || ''}</span>
            <span class="pub-date">${item.publish_date || ''}</span>
          </div>
          <div class="news-card-body">
            <a href="${item.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="news-title-link">${item.title}</a>
            <p class="news-summary">${item.summary || ''}</p>
            <div class="news-params">${paramsHtml}</div>
          </div>
          <div class="news-card-footer">
            <span>${item.progress || ''}</span>
            <a href="${item.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="source-link">${item.source} →</a>
          </div>
        </article>
      `;
    }).join('');
  },

  renderArchive() {
    const container = document.getElementById('archive-list');

    if (!this.archive || this.archive.length === 0) {
      container.innerHTML = '<div class="loading">暂无历史归档。</div>';
      return;
    }

    container.innerHTML = this.archive.map(dateStr => {
      const parts = dateStr.split('-');
      const display = `${parts[1]}/${parts[2]}`;
      return `
        <div class="archive-item" data-date="${dateStr}">
          <div class="archive-date">${display}</div>
          <div class="archive-note">${dateStr}</div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.archive-item').forEach(el => {
      el.addEventListener('click', () => this.loadArchive(el.dataset.date));
    });
  },

  async loadArchive(date) {
    try {
      const data = await fetch(`data/archive/${date}.json`).then(r => r.json()).catch(() => null);
      if (!data) throw new Error('not found');
      this.data = data;
      this.activeCategory = 'all';
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const allBtn = document.querySelector('.nav-btn[data-category="all"]');
      if (allBtn) allBtn.classList.add('active');
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert('加载归档失败，可能该日期暂无存档。');
    }
  },

  bindEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.dataset.category;
        this.renderNews();
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
