# Dan Ray Rollan — Static portfolio

A responsive HTML, CSS, and JavaScript portfolio for GitHub Pages. No framework, external dependencies, CDN, package installation, subscription, or build step. Content is editable in YAML.

## Pages

- `index.html`: introduction, personality, experience totals, company timeline, and contact.
- `work.html`: company experience timeline, selected work, and technical skills.
- `reviews.html`: reviews, recommendations, and full-letter links.
- `sample-letter.html`: clearly marked fictional letter used for the design preview.

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

The preview is currently enabled to let you see the requested designs. Work and Reviews show visible notices that their company timeline and review content are fictional. Home and the project/skill sections continue to use the supplied real background.

To show your real timeline and approved recommendations, update the real records in `content.yaml`, then set:

```yaml
preview:
  enabled: "false"
```

This removes the preview notice, sample rating row, and sample letter feature, and uses the real experience and recommendation records. Approved recommendation letters do not need a numeric rating. Empty quotes remain clearly labeled draft slots. You can remove unused records.

`sample-letter.html` remains a publicly accessible, clearly fictional sample file even when preview mode is off. Delete it and the unused demo assets before publication if desired.

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

The feature panel in demo mode opens the fictional sample letter. It is a document link, not a video player. The illustrated reviewer avatars are fictional design assets.

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

The homepage includes the same reference-style company timeline as Work. Preview mode shows the same fictional sample entries on both pages; disabling it uses the real YAML experience entries on both. Homepage project cards link to the corresponding project on work.html. Dark mode uses navy backgrounds and blue accents across all pages.

Both YAML requests use fetch cache: no-store, so browsers fetch the latest content without revalidating a stored copy (which can otherwise show HTTP 304 in the Network panel). A 304 is a cache validation response, not a YAML parsing error.
