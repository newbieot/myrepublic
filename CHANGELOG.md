# Changelog

## 2026-07-28 — Complete UI/UX redesign

### Added

- Four-stage upload, review, validation, and export workflow indicator.
- Professional two-column desktop workspace and mobile card-based record editing.
- Persistent file queue with file type, size, processing status, duplicate detection, removal, and progress feedback.
- Inline toast notifications and accessible live-region announcements.
- Search, status filtering, row selection, bulk deletion, and clear-workspace controls.
- Field-level validation for missing data, malformed phone numbers, duplicate serial numbers, duplicate references, short addresses, unsupported characters, and unsupported cities.
- Actual normalized export preview and export confirmation summary.
- Complete English UI, SEO metadata, structured data, manifest, robots, sitemap, 404 page, and security headers.
- Regression test report, 85-check automated evidence, screenshots, and production deployment documentation.

### Changed

- Replaced the single oversized form stack with a compact editable table on desktop and responsive record cards on mobile.
- Refactored inline CSS and JavaScript into maintainable application, parser, validation, and export files.
- Replaced jQuery, Bootstrap, Select2, Font Awesome, Lucide, and remote fonts with native browser APIs, system fonts, and internal SVG icons.
- Migrated the footer to the Template MILE structure and styling: 38 px desktop height, 36 px mobile height, navy bar, orange top border, left brand, centered description, and right creator badge.
- Address export normalization now preserves common operational punctuation (`. , / ( ) # -`) while still removing unsupported characters. Other exported text remains uppercase alphanumeric for compatibility.

### Preserved

- BAST HTML parsing selectors and extracted fields.
- `.html`, `.htm`, `.xlsx`, `.xls`, and `.csv` support.
- Existing spreadsheet aliases and standard input template compatibility.
- Manual recipient creation and Batam default destination.
- Destination zone data and `00` to `11` postcode transformation.
- Exact workbook header order, `Sheet1`, output filename, fixed account data, shipment values, and operational text values.

### Fixed

- Empty-state visibility now correctly disappears after recipient records are created or imported.
- A malformed or unsupported source no longer interrupts processing of valid queued files.
- File statuses remain visible after processing so users can understand completed, warning, duplicate, unsupported, and failed outcomes.

### Tested

- 85 automated browser and static checks passed with zero failures.
- Static asset integrity and English UI scan.
- HTML and CSV parsing, partial BAST warnings, duplicate-file detection, manual record creation, editing, validation, city mapping, postcode transformation, export-row compatibility, responsive layout, keyboard focus, and footer dimensions.
- Workbook template opens correctly with the expected headers.

No operational account constants or workbook headers were changed.
