'use strict';
/* Deliberately small YAML subset: nested mappings, quoted strings, and comments.
   No dependencies or build step. See README for the supported editing format. */
function parseContentYaml(source) {
  const root = Object.create(null);
  const stack = [{indent: -2, value: root}];
  for (const [index, raw] of source.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    const match = /^( *)([a-zA-Z_][a-zA-Z0-9_]*):(?:\s+(.*))?$/.exec(raw);
    if (!match || match[1].length % 2) throw new Error(`Invalid content format at line ${index + 1}`);
    const indent = match[1].length;
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1];
    if (indent !== parent.indent + 2) throw new Error(`Unexpected indentation at line ${index + 1}`);
    const key = match[2];
    if (['__proto__', 'prototype', 'constructor'].includes(key) || Object.hasOwn(parent.value, key)) throw new Error(`Invalid or repeated key at line ${index + 1}`);
    if (!match[3]) {
      const child = Object.create(null);
      parent.value[key] = child;
      stack.push({indent, value: child});
    } else {
      const value = JSON.parse(match[3]);
      if (typeof value !== 'string') throw new Error(`Use quoted text at line ${index + 1}`);
      parent.value[key] = value;
    }
  }
  return root;
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function setText(id, text) { const target = document.getElementById(id); if (target) target.textContent = text || ''; }
function safeLink(value, localAllowed = false) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    if (url.protocol === 'https:' || (localAllowed && url.origin === window.location.origin && url.protocol === window.location.protocol)) return url.href;
  } catch (_) { /* An invalid optional URL is omitted. */ }
  return null;
}
function renderPortfolio(data) {
  const p = data.profile;
  setText('name', p.name); setText('location', p.location); setText('headline', p.headline);
  setText('intro', p.intro); setText('role', p.role); setText('avatar', p.initials);
  setText('total-years', p.total_years); setText('dev-years', p.development_years);
  setText('experience-note', p.experience_note); setText('contact-note', p.contact_note);
  const page = document.body.dataset.page || 'home';
  document.title = page === 'home' ? `${p.name} — ${p.headline}` : `${page === 'work' ? 'Work' : page === 'letter' ? 'Sample recommendation' : 'Reviews'} | ${p.name}`;
  document.querySelector('meta[name="description"]').content = p.intro;
  const portrait = safeLink(p.portrait, true);
  if (portrait && document.getElementById('avatar')) {
    const image = element('img'); image.src = portrait; image.alt = '';
    image.addEventListener('error', () => setText('avatar', p.initials));
    document.getElementById('avatar').replaceChildren(image);
  }
  setText('about-title', data.about.heading); setText('about-text', data.about.text); setText('about-secondary', data.about.secondary);
  if (document.getElementById('principles')) Object.values(data.principles).forEach((item, i) => {
    const card = element('article');
    card.append(element('span', 'principle-number', String(i + 1).padStart(2, '0')), element('h3', '', item.title), element('p', '', item.text));
    document.getElementById('principles').append(card);
  });
  if (document.getElementById('projects')) Object.values(data.projects).forEach(item => {
    const card = element('article', 'project'); card.id = `project-${item.number}`; const header = element('div', 'project-header'); const body = element('div');
    body.append(element('p', 'project-category', item.category), element('h3', '', item.title), element('p', 'project-summary', item.summary));
    const tags = element('div', 'tags'); item.tags.split('|').forEach(tag => tags.append(element('span', 'tag', tag.trim()))); body.append(tags);
    const details = element('details'); details.append(element('summary', '', 'Behind the work'));
    const panel = element('div', 'detail-body');
    [['Context', item.context], ['My approach', item.approach], ['What this brings', item.takeaway]].forEach(([title, text]) => panel.append(element('h4', '', title), element('p', '', text)));
    details.append(panel); body.append(details); header.append(element('span', 'project-number', item.number), body); card.append(header); document.getElementById('projects').append(card);
  });
  if (document.getElementById('testimonials')) Object.values(data.testimonials || {}).forEach(item => {
    const card = element('article', 'recommendation');
    if (item.quote.trim()) card.append(element('blockquote', '', item.quote));
    else card.append(element('p', 'draft-label', 'RECOMMENDATION TO COME'), element('p', 'draft-copy', 'An approved excerpt from a recommendation letter will appear here.'));
    const identity = element('div', 'recommendation-identity');
    const avatar = element('span', 'recommender-avatar', item.initials || item.name.split(' ').map(n => n[0]).slice(0, 2).join(''));
    const photo = safeLink(item.photo, true);
    if (photo) { const img = element('img'); img.src = photo; img.alt = ''; img.loading = 'lazy'; img.addEventListener('error', () => { avatar.textContent = item.initials || '•'; }); avatar.replaceChildren(img); }
    const attribution = element('div'); attribution.append(element('p', 'quote-name', item.name), element('p', 'quote-role', item.role));
    identity.append(avatar, attribution); card.append(identity);
    if (item.relationship) card.append(element('p', 'recommendation-context', item.relationship));
    const letter = safeLink(item.letter, true);
    if (letter) {
      const link = element('a', 'letter-link', item.letter_label || 'Read full letter ↗');
      link.href = letter; link.target = '_blank'; link.rel = 'noopener noreferrer'; card.append(link);
    }
    document.getElementById('testimonials').append(card);
  });
  if (document.getElementById('timeline')) Object.values(data.experience).forEach(item => {
    const row = element('article', 'timeline-item'); const body = element('div');
    const icon = element('span', 'company-icon', item.initials || '•');
    const logo = safeLink(item.logo, true);
    if (logo) { const image = element('img'); image.src = logo; image.alt = ''; image.loading = 'lazy'; image.addEventListener('error', () => { icon.textContent = item.initials || '•'; }); icon.replaceChildren(image); }
    body.append(element('p', 'timeline-label', item.dates || item.label), element('h3', '', `${item.title} at ${item.company}`), element('p', 'timeline-text', item.text));
    if (item.contributions) {
      const list = element('ul', 'contributions'); item.contributions.split('|').forEach(text => list.append(element('li', '', text.trim()))); body.append(list);
    }
    const projectPath = item.project_url && item.project_url.startsWith('#') && !document.getElementById('projects') ? `work.html${item.project_url}` : item.project_url;
    const projectUrl = safeLink(projectPath, true);
    if (projectUrl && item.project_title) {
      const preview = element('a', 'experience-project'); preview.href = projectUrl;
      if (new URL(projectUrl).origin !== location.origin) { preview.target = '_blank'; preview.rel = 'noopener noreferrer'; }
      const imageUrl = safeLink(item.project_image, true);
      if (imageUrl) { const image = element('img'); image.src = imageUrl; image.alt = ''; image.loading = 'lazy'; preview.append(image); }
      const text = element('div'); text.append(element('strong', '', item.project_title));
      if (item.project_summary) text.append(element('p', '', item.project_summary)); preview.append(text, element('span', 'project-arrow', '↗')); body.append(preview);
    }
    row.append(icon, body); document.getElementById('timeline').append(row);
  });
  if (document.getElementById('skills')) Object.values(data.skills).forEach(item => {
    const card = element('div'); const list = element('ul');
    item.items.split('|').forEach(skill => list.append(element('li', '', skill.trim())));
    card.append(element('h3', '', item.title), list); document.getElementById('skills').append(card);
  });
  const links = document.getElementById('contact-links');
  if (!links) return;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
    const email = element('a', 'button', 'Say hello ↗'); email.href = `mailto:${p.email}`; links.append(email);
  }
  [['LinkedIn', p.linkedin, false], ['GitHub', p.github, false], ['Résumé', p.resume, true]].forEach(([title, url, local]) => {
    const href = safeLink(url, local); if (!href) return;
    const a = element('a', 'text-link', `${title} ↗`); a.href = href;
    if (new URL(href).origin !== location.origin) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    links.append(a);
  });
  document.getElementById('contact-empty').hidden = links.children.length > 0;
}
if (typeof document !== 'undefined') {
  setText('year', new Date().getFullYear());
  const toggle = document.getElementById('theme-toggle');
  function applyTheme(dark) {
    document.body.dataset.theme = dark ? 'dark' : 'light';
    toggle.textContent = dark ? 'Light ◐' : 'Dark ◐';
    toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  let savedTheme; try { savedTheme = localStorage.getItem('portfolio-theme'); } catch (_) {}
  applyTheme(savedTheme === 'dark');
  toggle.addEventListener('click', () => {
    const dark = document.body.dataset.theme !== 'dark'; applyTheme(dark);
    try { localStorage.setItem('portfolio-theme', dark ? 'dark' : 'light'); } catch (_) {}
  });
  fetch('./content.yaml', {cache: 'no-store'})
    .then(response => { if (!response.ok) throw new Error('Content request failed'); return response.text(); })
    .then(async source => {
      const data = parseContentYaml(source);
      if (data.preview && data.preview.enabled === 'true' && document.getElementById('demo-notice')) {
        const response = await fetch('./demo-content.yaml', {cache: 'no-store'});
        if (!response.ok) throw new Error('Preview content request failed');
        const demo = parseContentYaml(await response.text());
        data.experience = demo.experience; data.testimonials = demo.testimonials;
        document.getElementById('demo-notice').hidden = false;
        if (document.body.dataset.page === 'reviews') {
          setText('review-rating', demo.summary.rating);
          setText('review-count', `Based on ${demo.summary.count} sample reviews`);
          document.getElementById('review-summary').hidden = false;
          document.getElementById('letter-feature').hidden = false;
        }
      }
      renderPortfolio(data);
    })
    .catch(error => { document.getElementById('load-error').hidden = false; console.error(error); });
}
if (typeof module !== 'undefined') module.exports = {parseContentYaml};
