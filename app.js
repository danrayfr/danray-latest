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
function letterAction(className, label) {
  const link = element('a', className);
  link.append(element('span', 'letter-action-label', 'Read Letter'));
  return link;
}
function renderLetter(letters, profileName) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || document.body.dataset.letterId;
  const item = id && Object.hasOwn(letters, id) ? letters[id] : null;
  const body = document.getElementById('letter-body');
  if (!item || !item.body || !item.body.trim()) {
    setText('letter-heading', 'Letter not found');
    setText('letter-body', 'This letter is unavailable. Return to Reviews to choose another letter.');
    document.title = `Letter not found | ${profileName}`;
    return;
  }
  setText('letter-heading', item.title || 'Letter of recommendation');
  setText('letter-date', item.date);
  setText('letter-salutation', item.salutation);
  item.body.split(/\n\s*\n/).filter(text => text.trim()).forEach(text => body.append(element('p', '', text.trim())));
  const signature = document.getElementById('letter-signature');
  if (item.closing) signature.append(element('span', '', item.closing));
  signature.append(element('strong', '', item.name));
  if (item.role) signature.append(element('span', '', item.role));
  document.title = `${item.name} — Recommendation | ${profileName}`;
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
      const link = letterAction('letter-link', item.letter_label || 'Read full letter');
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
  const skills = document.getElementById('skills');
  if (skills) Object.values(data.skills || {}).forEach(item => {
    const row = element('div', 'skill-row');
    const list = element('ul', 'skill-items');
    item.items.split('|').filter(skill => skill.trim()).forEach(skill => list.append(element('li', '', skill.trim())));
    row.append(element('h3', '', `${item.title}:`), list);
    skills.append(row);
  });
  const education = document.getElementById('education');
  if (education) {
    const entries = Object.values(data.education || {}).filter(item => item.qualification || item.school);
    if (!entries.length) education.append(element('p', 'empty-state', 'Education details coming soon.'));
    entries.forEach(item => {
      const record = element('article', 'education-item');
      const imageUrl = safeLink(item.image, true);
      if (imageUrl) {
        record.className += ' education-with-image';
        const image = element('img', 'education-image'); image.src = imageUrl;
        image.alt = ''; image.loading = 'lazy'; image.setAttribute('aria-hidden', 'true');
        image.addEventListener('error', () => { image.hidden = true; record.className = 'education-item'; });
        record.append(image);
      }
      const content = element('div', 'education-content');
      if (item.dates) content.append(element('p', 'record-date', item.dates));
      if (item.qualification) content.append(element('h3', '', item.qualification));
      if (item.school) content.append(element('p', 'muted', item.school));
      if (item.description) content.append(element('p', 'muted', item.description));
      record.append(content); education.append(record);
    });
  }
  const articles = document.getElementById('articles');
  if (articles) {
    const entries = Object.values(data.articles || {}).filter(item => item.title);
    if (!entries.length) articles.append(element('p', 'empty-state', 'Articles coming soon.'));
    entries.forEach(item => {
      const record = element('article', 'article-item');
      if (item.year) record.append(element('p', 'record-date', item.year));
      record.append(element('h3', '', item.title));
      if (item.summary) record.append(element('p', 'muted', item.summary));
      const href = safeLink(item.url, true);
      if (href) {
        const link = element('a', 'reading-link', 'Continue reading'); link.href = href;
        if (new URL(href).origin !== location.origin) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        record.append(link);
      } else if (data.design_preview && item.sample_text) {
        const preview = element('details', 'article-preview');
        preview.append(element('summary', '', 'Continue reading sample'), element('p', 'muted', item.sample_text));
        record.append(preview);
      }
      articles.append(record);
    });
  }
  const letters = document.getElementById('recommendation-letters');
  if (letters) {
    const seen = new Set();
    const entries = [...Object.values(data.testimonials || {}), ...Object.values(data.recommendation_letters || {})].filter(item => {
      const href = safeLink(item.letter, true);
      if (!href || seen.has(href)) return false;
      seen.add(href); return true;
    });
    if (!entries.length) letters.append(element('p', 'empty-state', 'Recommendation letters coming soon.'));
    const list = element('div', 'letter-list'); letters.append(list);
    let moreList;
    if (entries.length > 4) {
      const more = element('details', 'more-letters');
      more.append(element('summary', '', `View ${entries.length - 4} more ${entries.length - 4 === 1 ? 'letter' : 'letters'}`));
      moreList = element('div', 'letter-list'); more.append(moreList); letters.append(more);
    }
    entries.forEach((item, index) => {
      const row = element('article', 'letter-row');
      const info = element('div', 'letter-info');
      info.append(element('h3', '', item.name || 'Recommendation letter'));
      if (item.role) info.append(element('p', 'muted', item.role));
      if (item.relationship) info.append(element('p', 'letter-relationship', item.relationship));
      const link = letterAction('letter-read', item.letter_label || 'Read letter');
      link.href = safeLink(item.letter, true); link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${item.letter_label || 'Read letter'} from ${item.name || 'a colleague'} (opens in a new tab)`);
      row.append(info, link); (index < 4 ? list : moreList).append(row);
    });
  }
  const footerLinks = document.getElementById('footer-links');
  if (footerLinks) {
    const github = safeLink(p.github);
    const linkedin = safeLink(p.linkedin);
    if (github || linkedin) footerLinks.replaceChildren();
    [['LinkedIn', linkedin], ['GitHub', github]].forEach(([title, href]) => {
      if (!href) return;
      const link = element('a', '', title); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      footerLinks.append(link);
    });
  }
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
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = dark ? '#24272b' : '#fafaf8';
    toggle.textContent = dark ? 'Light ◐' : 'Dark ◐';
    toggle.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
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
      if (data.preview && data.preview.enabled === 'true' && (document.getElementById('timeline') || document.getElementById('testimonials'))) {
        const response = await fetch('./demo-content.yaml', {cache: 'no-store'});
        if (!response.ok) throw new Error('Preview content request failed');
        const demo = parseContentYaml(await response.text());
        data.experience = demo.experience; data.testimonials = demo.testimonials;
        data.education = demo.education; data.articles = demo.articles;
        data.design_preview = true;
        if (document.body.dataset.page === 'reviews') {
          setText('review-rating', demo.summary.rating);
          setText('review-count', `Based on ${demo.summary.count} sample reviews`);
          document.getElementById('review-summary').hidden = false;
        }
      }
      if (document.getElementById('recommendation-letters') || document.getElementById('letter-body')) {
        const response = await fetch('./letters.yaml', {cache: 'no-store'});
        if (!response.ok) throw new Error('Recommendation letters request failed');
        data.letters = parseContentYaml(await response.text()).letters || {};
        data.recommendation_letters = Object.fromEntries(Object.entries(data.letters).filter(([, item]) => item.name && ((item.body && item.body.trim()) || safeLink(item.file, true))).map(([id, item]) => [id, {
          ...item,
          letter: safeLink(item.file, true) ? item.file : `letter.html?id=${encodeURIComponent(id)}`,
          letter_label: item.letter_label || 'Read letter ↗'
        }]));
      }
      renderPortfolio(data);
      if (document.getElementById('letter-body')) renderLetter(data.letters, data.profile.name);
    })
    .catch(error => { document.getElementById('load-error').hidden = false; console.error(error); });
}
if (typeof module !== 'undefined') module.exports = {parseContentYaml};
