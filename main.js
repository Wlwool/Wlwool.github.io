const GITHUB_USER = 'Wlwool';
const PROJECTS_URL = 'projects.json';
const REPOS_URL = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`;
const SITE_START_YEAR = 2018;

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

// Живые данные GitHub необязательны: при любой ошибке карточки остаются.
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

function createProjectCard(project, repo) {
  const card = document.createElement('div');
  card.className = 'repo-card';

  const repoUrl = project.repo
    ? `https://github.com/${GITHUB_USER}/${project.repo}`
    : null;
  const title = repoUrl
    ? `<a href="${escapeHtml(repoUrl)}" target="_blank" rel="noopener">${escapeHtml(project.title)}</a>`
    : escapeHtml(project.title);

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
      `<span class="updated-date"><i class="bi bi-clock"></i> ${pushedDate}</span>`
    );
  }

  const demo = project.demo
    ? `<div class="repo-links"><a href="${escapeHtml(project.demo)}" target="_blank" rel="noopener">Открыть демо</a></div>`
    : '';

  card.innerHTML = `
    <h3>${title}</h3>
    <p class="repo-description">${escapeHtml(project.description)}</p>
    ${tags ? `<ul class="repo-tags">${tags}</ul>` : ''}
    ${stats.length ? `<div class="repo-stats">${stats.join('')}</div>` : ''}
    ${demo}
  `;
  return card;
}

async function showProjects() {
  const container = document.getElementById('github-projects');
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

function showCurrentYear() {
  const yearElement = document.getElementById('year');
  if (!yearElement) {
    return;
  }
  const currentYear = new Date().getFullYear();
  yearElement.textContent =
    currentYear > SITE_START_YEAR
      ? `${SITE_START_YEAR}–${currentYear}`
      : String(SITE_START_YEAR);
}

showCurrentYear();
showProjects();
