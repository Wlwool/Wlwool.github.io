const GITHUB_USER = 'Wlwool';
const PROJECTS_URL = 'projects.json';
const REPOS_URL = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`;

const LANGUAGE_COLORS = {
  Python: '#3776ab',
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  CSS: '#1572b6',
  TypeScript: '#2b7489',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00add8',
  Rust: '#dea584',
  PHP: '#4f5d95',
  Ruby: '#701516',
  Swift: '#ffac45',
  Kotlin: '#7f52ff',
  Dart: '#00b4ab',
  Shell: '#89e051',
  Dockerfile: '#384d54',
};

let galleryItems = [];
let galleryIndex = 0;

function byId(id) {
  return document.getElementById(id);
}

function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || '#666';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadProjects() {
  const response = await fetch(PROJECTS_URL);
  if (!response.ok) {
    throw new Error(`projects.json: ${response.status}`);
  }
  return response.json();
}

async function loadRepos() {
  try {
    const response = await fetch(REPOS_URL);
    if (!response.ok) {
      throw new Error(`GitHub API: ${response.status}`);
    }
    const repos = await response.json();
    return new Map(repos.map((repo) => [repo.name.toLowerCase(), repo]));
  } catch (error) {
    console.warn('GitHub API недоступен, живые данные не показываются:', error);
    return new Map();
  }
}

function renderGallery() {
  const item = galleryItems[galleryIndex];
  const hasSeveral = galleryItems.length > 1;
  byId('gallery-image').src = item.src;
  byId('gallery-image').alt = item.alt || '';
  byId('gallery-caption').textContent = item.alt || '';
  byId('gallery-counter').textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
  byId('gallery-prev').hidden = !hasSeveral;
  byId('gallery-next').hidden = !hasSeveral;
}

function stepGallery(delta) {
  galleryIndex = (galleryIndex + delta + galleryItems.length) % galleryItems.length;
  renderGallery();
}

function openGallery(title, items) {
  galleryItems = items;
  galleryIndex = 0;
  byId('gallery-title').textContent = title;
  renderGallery();
  byId('gallery').showModal();
}

function setupGallery() {
  const dialog = byId('gallery');
  if (!dialog) {
    return;
  }

  byId('gallery-close').addEventListener('click', () => dialog.close());
  byId('gallery-prev').addEventListener('click', () => stepGallery(-1));
  byId('gallery-next').addEventListener('click', () => stepGallery(1));

  // Клик по затемнённому фону закрывает окно.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener('keydown', (event) => {
    if (galleryItems.length < 2) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      stepGallery(-1);
    } else if (event.key === 'ArrowRight') {
      stepGallery(1);
    }
  });
}

function createProjectCard(project, repo) {
  const card = document.createElement('div');
  card.className = 'repo-card';

  const repoUrl = project.repo
    ? `https://github.com/${GITHUB_USER}/${project.repo}`
    : null;
  const title = repoUrl
    ? `<a href="${escapeHtml(repoUrl)}" target="_blank" rel="noopener">${escapeHtml(project.title)}</a>`
    : escapeHtml(project.title);

  const badge =
    project.kind === 'commercial'
      ? '<span class="repo-badge">Заказной проект, код закрыт</span>'
      : '';

  const tags = (project.stack || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  const stats = [];
  if (repo && repo.language) {
    stats.push(
      `<span class="language" style="color: ${getLanguageColor(repo.language)}">${escapeHtml(repo.language)}</span>`
    );
  }
    if (repo && repo.pushed_at) {
    const pushedDate = new Date(repo.pushed_at).toLocaleDateString('ru-RU');
    stats.push(
      `<span class="updated-date" title="Дата последнего обновления репозитория"><i class="bi bi-clock"></i> обновлён ${pushedDate}</span>`
    );
  }

  const screenshots = Array.isArray(project.screenshots) ? project.screenshots : [];
  const links = [];
  if (project.demo) {
    links.push(
      `<a href="${escapeHtml(project.demo)}" target="_blank" rel="noopener">Открыть демо</a>`
    );
  }
  if (screenshots.length > 0) {
    links.push(
      `<button type="button" class="repo-gallery-button">Скриншоты (${screenshots.length})</button>`
    );
  }

  card.innerHTML = `
    ${badge}
    <h3>${title}</h3>
    <p class="repo-description">${escapeHtml(project.description)}</p>
    ${tags ? `<ul class="repo-tags">${tags}</ul>` : ''}
    ${stats.length ? `<div class="repo-stats">${stats.join('')}</div>` : ''}
    ${links.length ? `<div class="repo-links">${links.join('')}</div>` : ''}
  `;

  const galleryButton = card.querySelector('.repo-gallery-button');
  if (galleryButton) {
    galleryButton.addEventListener('click', () =>
      openGallery(project.title, screenshots)
    );
  }
  return card;
}

async function showProjects() {
  const container = byId('github-projects');
  try {
    const [projects, repos] = await Promise.all([loadProjects(), loadRepos()]);
    container.innerHTML = '';
    projects.forEach((project) => {
      const repo = project.repo ? repos.get(project.repo.toLowerCase()) : undefined;
      container.appendChild(createProjectCard(project, repo));
    });
  } catch (error) {
    console.error('Ошибка загрузки проектов:', error);
    container.innerHTML = '<p>Не удалось загрузить проекты</p>';
  }
}

function showClock() {
  const clockElement = byId('clock');
  if (!clockElement) {
    return;
  }

  function update() {
    const now = new Date();
    clockElement.dateTime = now.toISOString();
    clockElement.textContent =
      `${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU')}`;
  }

  update();
  setInterval(update, 1000);
}

function typeWhoami() {
  const command = byId('whoami-command');
  const terminal = document.querySelector('.terminal');
  if (!command || !terminal) {
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const text = command.dataset.text;
  terminal.classList.add('typing');
  command.textContent = '';

  let printed = 0;
  setTimeout(() => {
    const timer = setInterval(() => {
      printed += 1;
      command.textContent = text.slice(0, printed);
      if (printed >= text.length) {
        clearInterval(timer);
        terminal.classList.remove('typing');
      }
    }, 120);
  }, 400);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Запасной путь для небезопасного контекста.
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  try {
    if (!document.execCommand('copy')) {
      throw new Error('execCommand("copy") вернул false');
    }
  } finally {
    document.body.removeChild(field);
  }
}

function setupCopyEmail() {
  const button = byId('copy-email');
  const status = byId('copy-status');
  if (!button || !status) {
    return;
  }

  let timer;
  button.addEventListener('click', async () => {
    try {
      await copyText(button.dataset.email);
      status.textContent = 'Скопировано';
    } catch (error) {
      console.warn('Не удалось скопировать:', error);
      status.textContent = 'Не удалось скопировать';
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

setupGallery();
showClock();
showProjects();
typeWhoami();
setupCopyEmail();
