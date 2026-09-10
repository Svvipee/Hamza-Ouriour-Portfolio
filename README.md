# Hamza Ouriour — Engineering portfolio

Static HTML, CSS and JavaScript, compatible with GitHub Pages at the repository root.
No browser framework, package installation, or client-side rendering is required.

## Edit and preview

Edit `build_site.py` for homepage/case-study content, templates, and supporting pages.
Edit `styles.css`, `lab.css`, `site.js`, or `thermo.js` for styling and interactions.
The torsion example remains directly authored in `torsion_control.html`.

```sh
python build_site.py
python check_site.py
python -m http.server 8765 --bind 127.0.0.1
```

Commit generated HTML along with the source edits. GitHub Pages serves the committed pages.
The Python authoring script does not run on the server.

## Architecture

- `index.html`: projects, experience, skills, education/about, project library, résumé, contact.
- `projects/`: LTV, UAV, AeroSense, EIS, Hallam-ICS, L’SPACE, robotics, thermofluids.
- Original routes preserved: `project_v6.html`, `srr_viewer_fixed.html`,
  `thermo_demo_full.html`, `thermo_demo_themed.html`, `torsion_control.html`.
- Original engine renders and the Team 13 PDF remain unchanged.
- `rover-concept.png` is extracted team artwork from the report, not generated imagery.
- `Hamza_Ouriour_Resume.pdf` is the supplied résumé, copied without modification.

## Content integrity

The résumé supersedes the prior site for education, roles, dates, and results. Existing
UAV troubleshooting detail and the L’SPACE team report supply additional context.
Reported results are not independently reproduced. Simulation, concept requirements,
team contributions, and illustrative demo settings are identified in the pages.
Troubleshooting narratives include the owner-confirmed LTV, Hallam, EIS, and AeroSense stories.

`DATA-VERIFY-T01` in the torsion example identifies inherited illustrative firmware settings.
The portfolio owner confirmed the troubleshooting stories and authorized publication.
They appear as regular engineering case-study content.

The old `admin.js` is retained in version control but no longer loaded. Its editor stored
changes only in the visitor's browser and could overlay stale résumé content. Use the
source workflow above for durable changes. No localStorage data is deleted.

## Validation

Run `check_site.py` after regeneration. Browser checks should include project filters,
mobile menu, case-study anchors, PDF access, valid and invalid demo inputs, and desktop/mobile
overflow. The ideal-Brayton check case uses pressure ratio 8, γ 1.4, T₁ 300 K:
efficiency approximately 44.80%, T₂ approximately 543.4 K, T₃ approximately 1358.6 K, T₄ 750 K.
