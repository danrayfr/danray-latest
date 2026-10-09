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
function lifecycleDiagram(compact = false, stages = []) {
  const ns = 'http://www.w3.org/2000/svg';
  const svgNode = (tag, attributes = {}, text) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text) node.textContent = text;
    return node;
  };
  const svg = svgNode('svg', {viewBox: '0 0 520 520', class: `lifecycle-wheel${compact ? ' lifecycle-wheel-preview' : ''}`});
  if (compact) svg.setAttribute('aria-hidden', 'true');
  else { svg.setAttribute('role', 'group'); svg.setAttribute('aria-label', 'Five-stage ticket lifecycle. Select a stage to read its breakdown.'); }
  const point = (radius, angle) => {
    const radians = angle * Math.PI / 180;
    return `${(260 + radius * Math.cos(radians)).toFixed(2)} ${(260 + radius * Math.sin(radians)).toFixed(2)}`;
  };
  stages.forEach((stage, index) => {
    const label = stage.title;
    const start = -90 + index * 72, end = start + 72;
    const path = `M ${point(218, start)} A 218 218 0 0 1 ${point(218, end - 12)} L ${point(174, end + 3)} L ${point(130, end - 12)} A 130 130 0 0 0 ${point(130, start)} L ${point(174, start + 15)} Z`;
    const group = svgNode(compact ? 'g' : 'a', {class: `lifecycle-sector lifecycle-sector-${index + 1}`});
    if (!compact) {
      group.setAttribute('href', `#lifecycle-stage-${index + 1}`);
      group.setAttribute('aria-label', `Stage ${index + 1}: ${label}`);
      group.addEventListener('click', () => {
        const detail = document.getElementById(`lifecycle-stage-${index + 1}`);
        if (detail) detail.open = true;
      });
    }
    group.append(svgNode('path', {d: path}));
    const radians = (start + 30) * Math.PI / 180;
    const x = 260 + 174 * Math.cos(radians), y = 260 + 174 * Math.sin(radians);
    group.append(svgNode('text', {x, y: y - 16, class: 'wheel-number'}, String(index + 1).padStart(2, '0')));
    const lines = [];
    label.split(' ').forEach(word => {
      const last = lines.length - 1;
      if (last >= 0 && `${lines[last]} ${word}`.length <= 12) lines[last] += ` ${word}`;
      else lines.push(word);
    });
    const text = svgNode('text', {x, y: y + 7, class: 'wheel-label'});
    lines.forEach((line, lineIndex) => text.append(svgNode('tspan', {x, dy: lineIndex ? 18 : 0}, line)));
    group.append(text);
    svg.append(group);
  });
  svg.append(svgNode('text', {x: 260, y: 233, class: 'wheel-center-caption'}, 'TICKET LIFECYCLE'),
    svgNode('text', {x: 260, y: 267, class: 'wheel-center-title'}, 'Support as'),
    svgNode('text', {x: 260, y: 295, class: 'wheel-center-title'}, 'a feature.'));
  return svg;
}
function compareLetters(a, b) {
  const priorities = ['senior_manager', 'lead_engineer', 'principal_engineer', 'staff_engineer', 'senior_engineer', 'technical_support_engineer'];
  const rank = item => { const index = priorities.indexOf(item.role_group); return index < 0 ? priorities.length : index; };
  const date = item => /^\d{4}-\d{2}-\d{2}$/.test(item.date_sort || '') ? item.date_sort : '';
  return rank(a) - rank(b) || date(b).localeCompare(date(a));
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
  if (item.signature) item.signature.split('\n').forEach((line, index) => signature.append(element(index === 0 ? 'strong' : 'span', '', line)));
  else {
    signature.append(element('strong', '', item.name));
    if (item.role) signature.append(element('span', '', item.role));
  }
  document.title = `${item.name} — Recommendation | ${profileName}`;
}
function renderPortfolio(data) {
  const p = data.profile;
  setText('name', p.name); setText('location', p.location); setText('headline', p.headline);
  setText('intro', p.intro); setText('role', p.role); setText('avatar', p.initials);
  setText('total-years', p.total_years); setText('development-since', p.development_since);
  setText('experience-note', p.experience_note); setText('contact-note', p.contact_note);
  const page = document.body.dataset.page || 'home';
  document.title = page === 'home' ? `${p.name} — ${p.headline}` : `${page === 'work' ? 'Work' : page === 'letter' ? 'Sample recommendation' : 'Reviews'} | ${p.name}`;
  document.querySelector('meta[name="description"]').content = p.intro;
  const portrait = safeLink(p.portrait, true);
  ['avatar', 'brand-avatar'].forEach(id => {
    const target = document.getElementById(id);
    if (!target) return;
    target.textContent = p.initials;
    if (!portrait) return;
    target.className += ' has-photo';
    const image = element('img'); image.src = portrait; image.alt = '';
    image.addEventListener('error', () => {
      target.textContent = p.initials;
      target.className = target.className.replace(/\s*has-photo/g, '');
    });
    target.replaceChildren(image);
  });
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
    const resourceUrl = safeLink(item.url);
    if (resourceUrl) {
      const link = element('a', 'project-resource', item.url_label || 'View project');
      link.href = resourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${item.url_label || 'View project'}: ${item.title} (opens in a new tab)`);
      body.append(link);
    }
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
    const attribution = element('div'); const name = element('p', 'quote-name', item.name);
    const profileUrl = safeLink(item.profile_url);
    if (profileUrl) {
      const profile = element('a', 'testimonial-profile', item.name); profile.href = profileUrl;
      profile.target = '_blank'; profile.rel = 'noopener noreferrer';
      profile.setAttribute('aria-label', `${item.name} on LinkedIn (opens in a new tab)`);
      name.replaceChildren(profile);
    }
    attribution.append(name, element('p', 'quote-role', item.role));
    identity.append(avatar, attribution); card.append(identity);
    const context = [item.relationship, item.date].filter(Boolean).join(' · ');
    if (context) card.append(element('p', 'recommendation-context', context));
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
      if (item.project_diagram === 'ticket_lifecycle') preview.append(lifecycleDiagram(true, Object.values(data.support_lifecycle?.stages || {})));
      const imageUrl = safeLink(item.project_image, true);
      if (imageUrl) { const image = element('img'); image.src = imageUrl; image.alt = ''; image.loading = 'lazy'; preview.append(image); }
      const text = element('div'); text.append(element('strong', '', item.project_title));
      if (item.project_summary) text.append(element('p', '', item.project_summary)); preview.append(text, element('span', 'project-arrow', '↗')); body.append(preview);
    }
    row.append(icon, body); document.getElementById('timeline').append(row);
  });
  const lifecycle = data.support_lifecycle;
  if (lifecycle && document.getElementById('lifecycle-map')) {
    document.getElementById('lifecycle-diagram').append(lifecycleDiagram(false, Object.values(lifecycle.stages || {})));
    ['title', 'intro', 'goal', 'feedback', 'principles', 'why', 'value', 'philosophy'].forEach(key => setText(`lifecycle-${key}`, lifecycle[key]));
    setText('lifecycle-philosophy-text', lifecycle.philosophy_text);
    Object.values(lifecycle.stages || {}).forEach((stage, index) => {
      const number = String(index + 1).padStart(2, '0');
      const step = element('li');
      const link = element('a'); link.href = `#lifecycle-stage-${index + 1}`;
      link.append(element('span', 'lifecycle-number', number), element('span', '', stage.title));
      step.append(link); document.getElementById('lifecycle-map').append(step);
      const detail = element('details', 'lifecycle-stage'); detail.id = `lifecycle-stage-${index + 1}`;
      const summary = element('summary');
      const heading = element('span'); heading.append(element('strong', '', stage.title), element('span', 'lifecycle-summary', stage.summary));
      summary.append(element('span', 'lifecycle-step-number', number), heading);
      const body = element('div', 'lifecycle-stage-body'); body.append(element('p', '', stage.description));
      const checks = element('ul'); stage.checks.split('|').forEach(check => checks.append(element('li', '', check.trim())));
      body.append(checks); detail.append(summary, body);
      link.addEventListener('click', () => { detail.open = true; });
      document.getElementById('lifecycle-stages').append(detail);
    });
  }
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
    const articleSection = document.getElementById('articles-section');
    if (articleSection) articleSection.hidden = entries.length === 0;
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
    }).sort(compareLetters);
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
      if (item.date) info.append(element('p', 'letter-list-date', item.date));
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
  [['LinkedIn', p.linkedin, false, 'linkedin'], ['GitHub', p.github, false, 'github'], ['Résumé', p.resume, true, 'document']].forEach(([title, url, local, icon]) => {
    const href = safeLink(url, local); if (!href) return;
    const a = element('a', 'contact-link'); a.href = href;
    const symbol = element('span', `contact-icon contact-icon-${icon}`);
    symbol.setAttribute('aria-hidden', 'true');
    a.append(symbol, element('span', '', title));
    a.target = '_blank'; a.rel = 'noopener noreferrer';
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
      if (document.getElementById('testimonials') && data.recommendation_letters) {
        const letterTestimonials = Object.entries(data.recommendation_letters).filter(([, item]) => item.excerpt).map(([id, item]) => [id, {
          ...item, quote: item.excerpt, photo: '', letter_label: 'Read Letter'
        }]);
        data.testimonials = Object.fromEntries([...letterTestimonials, ...Object.entries(data.testimonials || {})].sort((a, b) => compareLetters(a[1], b[1])));
        document.getElementById('review-summary').hidden = true;
      }
      renderPortfolio(data);
      if (document.getElementById('letter-body')) renderLetter(data.letters, data.profile.name);
    })
    .catch(error => { document.getElementById('load-error').hidden = false; console.error(error); });
}
if (typeof module !== 'undefined') module.exports = {parseContentYaml, compareLetters};
