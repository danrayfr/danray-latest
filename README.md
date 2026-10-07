# Dan Ray Rollan — Static portfolio

A responsive HTML, CSS, and JavaScript portfolio for GitHub Pages. No framework, external dependencies, CDN, package installation, subscription, or build step. Content is editable in YAML.

## Pages

- `index.html`: introduction, personality, experience totals, skills, company timeline, education, articles, and contact.
- `work.html`: company experience timeline, selected work, technical skills, and education.
- `reviews.html`: reviews, recommendations, and full-letter links.
- `letter.html`: one shared recommendation page; choose a letter with `?id=LETTER_ID`.
- `sample-letter.html`: existing sample URL, now displaying the `avery` record from `letters.yaml`.

Home, Work, and Reviews navigate between real HTML files. Work and Reviews are not homepage sections or hash routes. Shared scripts render only the content containers present on each page.

## Preview locally

In the extracted folder, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. You can also open http://localhost:8000/work.html or http://localhost:8000/reviews.html directly.

Use a web server rather than double-clicking index.html: JavaScript fetches the YAML files, which generally does not work through file://. Edit content, save, and refresh your browser.

## Design preview and real content

`content.yaml` holds the real profile, projects, skills, experience, and testimonial slots. `demo-content.yaml` holds fictional companies, dates, contributions, reviewer identities, quotes, and a sample rating. Fictional demo icons, illustrated avatars, and the project preview are in `assets/demo-*.svg`.

The preview is currently enabled to let you see the requested designs. Visible design-preview banners and fictional-content notices have been removed. Sample names, sample letter labels, and editable placeholders remain. Home and the project/skill sections continue to use the supplied real background.

To show your real timeline and approved recommendations, update the real records in `content.yaml`, then set:

```yaml
preview:
  enabled: "false"
```

This removes the sample rating row and uses the real experience, education, article, and recommendation records. The static support catchphrase remains visible. Approved recommendation letters do not need a numeric rating. Empty quotes remain clearly labeled draft slots. You can remove unused records.

`sample-letter.html` remains a publicly accessible, sample URL even when preview mode is off. Its text comes from `letters.yaml`. Delete it and the unused demo assets before publication if desired.

## Company experience

The Work page follows the provided timeline structure: small company logo, thin vertical line, dates, bold role/company heading, summary, contribution bullets, and an optional linked project preview.

Edit each entry under `experience` in `content.yaml`. Add records in display order for each employer or assignment:

```yaml
  current:
    initials: "SN"
    logo: "assets/company-logo.svg"
    dates: "Your confirmed start date – Present"
    label: "CURRENT FOCUS"
    title: "Technical Support Engineer"
    company: "SupportNinja · Automox assignment"
    text: "A concise description of the role."
    contributions: "First contribution. | Second contribution. | Third contribution."
    project_url: ""
    project_title: ""
    project_summary: ""
    project_image: ""
```

Update the existing record rather than replacing the whole file with this snippet. Add logo/image files to assets and use those relative paths. If no logo is supplied, initials are displayed. Blank `dates` uses `label`. A project preview appears when both `project_url` and `project_title` are supplied. For a local project anchor, use `#project-02` for the project whose `number` is `02` on the Work page.

The real experience records retain broad engineering and enablement descriptions until exact employer names, roles, and dates are supplied. Demo dates and employers are not actual career history.

## Recommendations and letters

Edit records under `testimonials` in `content.yaml`:

```yaml
  colleague:
    quote: "An exact, approved short excerpt from the letter."
    initials: "AB"
    photo: "assets/author.jpg"
    name: "Author’s full name"
    role: "Author’s title and company"
    relationship: "My direct manager during this role"
    letter: "assets/letters/recommendation-author.pdf"
    letter_label: "Read full letter (PDF) ↗"
```

Create assets/letters and add an approved PDF. Blank photo paths use initials; blank letter paths omit the link. Letters open in another tab and may display or download according to browser settings. Upload the approved public version of a letter, with private details removed where appropriate.

The Reviews feature panel displays the catchphrase “Support as a feature” and the supporting line “Good engineering leaves people feeling confident”. It is a static panel with no link and remains visible in both sample and real-content modes. The illustrated reviewer avatars are fictional design assets.

## Profile and contact

Update these fields inside the existing `profile` mapping:

```yaml
  email: "you@example.com"
  linkedin: "https://www.linkedin.com/in/YOUR-PROFILE/"
  github: "https://github.com/YOUR-USERNAME"
  resume: "assets/resume.pdf"
  portrait: "assets/portrait.jpg"
```

Blank contact links are omitted. Add the corresponding local files. The real profile separately labels seven years of overall experience including internship and five years of professional software development, based on supplied information. Confirm against your final CV before publication. Those figures are not added together.

## YAML editing format

The dependency-free loader supports a small valid YAML subset:

- Nested mappings with two spaces per indentation level.
- Keys containing letters, numbers, and underscores; begin with a letter or underscore.
- Double-quoted, single-line string values, including years and preview settings.
- Full-line `#` comments.
- Records use named keys rather than YAML arrays.
- Escape a literal double quote with `\"`; use `\n` inside a string for a line break.
- Separate contribution bullets, skills, and tags with ` | `.

Do not use block scalars, unquoted values, arrays, aliases, or inline comments. This is not a general-purpose YAML parser.

## GitHub Pages deployment

1. Create a public GitHub repository, such as portfolio.
2. Upload the CONTENTS of this folder into the repository root. index.html must be directly in the publishing folder.
3. Include the empty `.nojekyll` file. If your file picker hides it, create it in GitHub.
4. Open repository Settings → Pages.
5. Choose Deploy from a branch → main → /(root), then save.
6. GitHub will show the published URL, typically https://YOUR-USERNAME.github.io/portfolio/.

All page and asset links are relative, so they work on repository project sites. Naming the repository YOUR-USERNAME.github.io gives you a root profile site. No GitHub upload or live deployment has been performed in this task.

Official instructions:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Verification and accessibility

JavaScript syntax and both YAML files were checked. All four pages were exercised in a lightweight DOM test in preview and real-content modes to confirm page-specific rendering without missing-element errors. All static file links and section anchors were checked, including inter-page navigation. Visual browser rendering and live GitHub Pages deployment have not been verified here.

The site includes semantic sections, native keyboard-accessible project disclosures, visible focus states, skip navigation, reduced-motion support, responsive layouts, and an optional locally remembered dark theme. Content is inserted as text rather than interpreted HTML. Contact links do not submit data to a server.

The homepage includes the same reference-style company timeline as Work. Preview mode shows the same fictional sample entries on both pages; disabling it uses the real YAML experience entries on both. Homepage project cards link to the corresponding project on work.html. The original layout is retained. The Warm Slate & Blue palette uses warm off-white backgrounds, white cards, slate text, and restrained blue accents in light mode. Dark mode uses charcoal backgrounds, softer slate cards, pale text, and light blue accents. Education entries use subtle bordered cards in both themes.

Both YAML requests use fetch cache: no-store, so browsers fetch the latest content without revalidating a stored copy (which can otherwise show HTTP 304 in the Network panel). A 304 is a cache validation response, not a YAML parsing error.

## Education, articles, and footer links

The `education` and `articles` mappings in `content.yaml` start empty. With preview enabled, `demo-content.yaml` provides two fictional education entries and three fictional articles. Sample articles expand inline. With preview disabled, the site uses the real records and shows coming-soon text for empty sections. Add more named records using the same structure:

```yaml
education:
  primary:
    dates: "YOUR YEARS"
    qualification: "YOUR QUALIFICATION"
    school: "YOUR SCHOOL"
    description: ""
articles:
  first:
    year: "PUBLICATION YEAR"
    title: "YOUR ARTICLE TITLE"
    summary: "A short description."
    url: "https://example.com/your-article"
```

Fill in `profile.github` and `profile.linkedin` to show live links in the shared footer. Until a profile URL is supplied, the footer displays GitHub as an inactive placeholder. Education and articles use sample records while preview is enabled. Recommendation letters always come from the separate `letters.yaml` file. The homepage Skills section reuses your existing skills and displays them as category/value rows. All original homepage sections remain in place.

## Recommendation letters in YAML

All recommendation letter content lives in `letters.yaml`. The file starts with six editable samples. Reviews keeps the same compact list, with four letters visible and the remaining letters under “View more letters”. Each text letter opens the shared `letter.html` page in a new tab.

Add a named record under `letters`. The name becomes its ID and URL; for example, `manager` opens `letter.html?id=manager`:

```yaml
letters:
  manager:
    name: "Author name"
    role: "Title and company"
    relationship: "My direct manager"
    date: "Letter date"
    title: "Letter of recommendation"
    salutation: "To whom it may concern,"
    body: "First paragraph.\n\nSecond paragraph."
    closing: "Kind regards,"
    file: ""
```

Use the existing quoted-string YAML format: two-space indentation and `\n\n` between paragraphs. Text is displayed as plain text, including when it contains HTML-like characters. No new HTML file is needed for another letter. Keep the record ID stable to preserve existing links.

If you already have a PDF or image, set `file` to its relative path, such as `"assets/letters/manager.pdf"`, and leave `body` empty. The list opens the file directly. You can optionally set `letter_label: "Read letter (PDF) ↗"`. Include each referenced file when deploying.

Letters linked from `testimonials` are still included in the list; duplicate URLs appear once. To link a testimonial to a YAML letter, set its `letter` field to `"letter.html?id=manager"`. Records with no author or no usable body/file are omitted. Unknown letter IDs show a useful message and a link back to Reviews. The `letters.yaml` records are independent of the preview toggle, so your approved letters will not be replaced by demo data.

Work experience appears before Skills on the homepage.

Education cards use a two-column grid on larger screens and stack on mobile. Set each education record's optional `image` field to a local school image, for example `"assets/school-campus.jpg"`. Images fade into the card surface above the text, with a quieter treatment in dark mode. Empty or failed images leave a plain card. The preview uses two fictional campus illustrations (`assets/demo-campus.svg` and `assets/demo-academy.svg`), not photographs of real schools.

## Typography

Ubuntu is used for headings, body text, navigation, and education cards. Ubuntu Mono is used for dates, project numbers, tags, and small technical labels. The fonts are bundled locally in `assets/fonts`, including the Ubuntu Font Licence and copyright notice; there are no external font service requests. Font loading uses `font-display: swap` and system fallbacks. Keep the font files and their license in the deployed site.
