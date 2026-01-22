// Main JS for the static documentation site (ES module)
const pages = [
  { id: 'intro', title: 'Introduction', file: 'docs/intro.html' },
  { id: 'getting-started', title: 'Getting Started', file: 'docs/getting-started.html' },
  { id: 'features', title: 'Features', file: 'docs/features.html' },
  { id: 'downloads', title: 'Downloads', file: 'docs/downloads.html' },
  { id: 'roadmap', title: 'Roadmap', file: 'docs/roadmap.html' },
  { id: 'faq', title: 'FAQ', file: 'docs/faq.html' },
  { id: 'contributing', title: 'Contributing', file: 'docs/contributing.html' },
  { id: 'changelog', title: 'Changelog', file: 'docs/changelog.html' },
];

// Elements (lazy loaded to avoid null references)
let sidebarNav, contentRoot, searchInput, searchResults, darkToggle, burger, siteVersion;

function initElements() {
  sidebarNav = document.getElementById('sidebar-nav');
  contentRoot = document.getElementById('page-root');
  searchInput = document.getElementById('search-input');
  searchResults = document.getElementById('search-results');
  darkToggle = document.getElementById('dark-toggle');
  burger = document.getElementById('burger');
  siteVersion = document.getElementById('site-version');
}

// Build sidebar
function buildSidebar() {
  pages.forEach(p => {
    const a = document.createElement('a');
    a.href = `#/docs/${p.id}`;
    a.textContent = p.title;
    a.dataset.file = p.file;
    a.dataset.pageId = p.id;
    a.addEventListener('click', handleLink);
    sidebarNav.appendChild(a);
  });
}

// Navigation handler
async function navigateTo(pageId, push = true) {
  const page = pages.find(p => p.id === pageId);
  if (!page) {
    contentRoot.innerHTML = `<h1>Not found</h1><p>Page "${pageId}" not found.</p>`;
    return;
  }

  // mark active
  if (sidebarNav && sidebarNav.children) {
    [...sidebarNav.children].forEach(a => a.classList.toggle('active', a.dataset.pageId === pageId));
  }

  // load page fragment
  if (!contentRoot) contentRoot = document.getElementById('page-root');
  contentRoot.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const resp = await fetch(page.file);
    if (!resp.ok) throw new Error(`Failed to load: ${resp.status} ${resp.statusText}`);
    const html = await resp.text();
    contentRoot.innerHTML = html;
    // run Prism highlighting after content added
    if (window.Prism) window.Prism.highlightAll();
    // focus main for accessibility
    document.getElementById('content').focus();
    if (push) history.pushState({ pageId }, '', `#/docs/${pageId}`);
  } catch (e) {
    contentRoot.innerHTML = `<h1>Error</h1><p>Unable to load page.</p>`;
    console.error(e);
  }
}

// Link handler for internal links
function handleLink(e) {
  e.preventDefault();
  const href = e.currentTarget.getAttribute('href') || '';
  if (href.startsWith('#/docs/')) {
    const parts = href.split('/');
    const id = parts[2] || 'intro';
    navigateTo(id);
  } else if (href.startsWith('#')) {
    // anchor within page
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  } else {
    // external link - allow
    window.open(href, '_blank');
  }
}

// history popstate
window.addEventListener('popstate', ev => {
  const state = ev.state;
  if (state && state.pageId) navigateTo(state.pageId, false);
  else {
    const id = location.hash.split('/').pop() || 'intro';
    navigateTo(id, false);
  }
});

// Build search index by fetching pages and indexing title + text
let lunrIndex = null;
let docStore = {};

async function buildSearchIndex() {
  if (!window.lunr) return;
  const docs = [];
  for (const p of pages) {
    try {
      const r = await fetch(p.file);
      const text = await r.text();
      // strip tags to plain text for indexing & snippet
      const tmp = document.createElement('div');
      tmp.innerHTML = text;
      const plain = tmp.textContent || tmp.innerText || '';
      const snippet = plain.slice(0, 250).replace(/\s+/g, ' ').trim();
      const id = p.id;
      docStore[id] = { id, title: p.title, url: `#/docs/${id}`, snippet };
      docs.push({ id, title: p.title, body: plain });
    } catch (err) {
      console.warn('indexing error', p.file, err);
    }
  }

  // Build lunr index
  lunrIndex = lunr(function () {
    this.ref('id');
    this.field('title', { boost: 10 });
    this.field('body');
    docs.forEach(d => this.add(d));
  });
}

// perform search and render results
function search(query) {
  if (!lunrIndex || !query) {
    searchResults.hidden = true;
    searchResults.innerHTML = '';
    return;
  }
  const results = lunrIndex.search(query + '*');
  if (!results.length) {
    searchResults.hidden = true;
    searchResults.innerHTML = '';
    return;
  }
  searchResults.hidden = false;
  searchResults.innerHTML = '';
  results.slice(0, 10).forEach(r => {
    const meta = docStore[r.ref];
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<a href="${meta.url}" data-link><strong>${meta.title}</strong></a>
      <div class="muted" style="color:var(--muted);font-size:0.9em">${meta.snippet}…</div>`;
    const a = div.querySelector('a');
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const id = meta.id;
      searchResults.hidden = true;
      navigateTo(id);
    });
    searchResults.appendChild(div);
  });
}

// UI: dark mode
function applyTheme(theme) {
  if (theme === 'light') document.documentElement.classList.add('light');
  else document.documentElement.classList.remove('light');
  localStorage.setItem('aurion:theme', theme);
}

function setupEventListeners() {
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      const cur = localStorage.getItem('aurion:theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      darkToggle.innerHTML = next === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
  }

  // burger toggle for mobile
  if (burger) {
    burger.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  // handle clicks for internal app links
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[data-link]');
    if (!a) return;
    ev.preventDefault();
    const href = a.getAttribute('href');
    if (href && href.startsWith('#/docs/')) {
      const id = href.split('/').pop();
      navigateTo(id);
    } else if (href === '/' || href === '#') {
      navigateTo('intro');
    } else {
      window.open(href, '_blank');
    }
  });

  // search input events
  if (searchInput) {
    let searchTimeout = null;
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (!q) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
        search(q);
      }, 200);
    });
    searchInput.addEventListener('focus', () => searchResults.hidden = false);
    searchInput.addEventListener('blur', () => setTimeout(()=>{ if (document.activeElement !== searchResults) searchResults.hidden = true }, 200));
  }
}


// Initialize
(async function init() {
  initElements();
  buildSidebar();
  setupEventListeners();
  
  // apply saved theme
  const savedTheme = localStorage.getItem('aurion:theme') || 'dark';
  applyTheme(savedTheme);
  if (darkToggle) {
    darkToggle.innerHTML = savedTheme === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }

  // site version (optional override from window.SITE_VERSION)
  if (window.SITE_VERSION) siteVersion.textContent = window.SITE_VERSION;

  await buildSearchIndex();

  // initial navigation
  const hash = location.hash;
  const initial = (hash && hash.startsWith('#/docs/')) ? hash.split('/').pop() : 'intro';
  navigateTo(initial, false);
})();