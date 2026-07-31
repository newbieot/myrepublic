# MyRepublic Shipment Batch Generator

A browser-based shipment data workspace for preparing MyRepublic recipient records for the existing PosIND bulk-upload workflow. The application accepts BAST HTML, Excel, and CSV source files, keeps a visible file queue, lets users review and correct every recipient record, validates critical fields, and exports the established MyRepublic workbook format.

> This is an independent operational utility in PosNew Hub. It must not be presented as an official MyRepublic or Pos Indonesia corporate application without documented authorization.

## Supported source files

- MyRepublic BAST `.html` and `.htm` files
- Microsoft Excel `.xlsx` and legacy `.xls` files
- Comma-separated `.csv` files
- Multiple files in one queue
- Drag-and-drop and file-picker upload

## BAST HTML support

The parser preserves the existing selector-based extraction workflow:

- recipient name, phone, and address from `table.t02 tr td div`;
- DO number from cells in `#t03`;
- one or multiple serial numbers from the fifth cell of data rows in `#t04`.

Malformed or partial BAST files do not stop the complete batch. Missing fields are surfaced as warnings and can be completed manually.

## Spreadsheet columns

The parser normalizes headers and supports the current aliases, including:

| Field | Supported examples |
|---|---|
| Serial number | `S/N`, `sn`, `Serial Number` |
| Reference | `Ref No`, `ref_no`, `No DO`, `DO Number` |
| Recipient name | `Nama Penerima`, `penerima`, `Recipient Name` |
| Phone | `No HP`, `phone`, `Nomor HP` |
| Address | `Alamat`, `address`, `Recipient Address` |
| City | `Kota`, `city`, `Destination City` |

The standard input template is available as `Template_Input_MyRepublic_KCU_Batam.xlsx` at the repository root.

## Workflow

1. **Upload Files** — stage BAST, Excel, or CSV files and review duplicate or unsupported items.
2. **Review Records** — edit serial number, reference, recipient name, phone, address, and destination city.
3. **Validate Data** — resolve missing values, malformed phone numbers, duplicate references, and duplicate serial numbers.
4. **Export Workbook** — review normalized export details and download `MyRepublic_Pos_Batam_Batch.xlsx`.

A recipient can also be added with **Add Recipient Manually**. Manual records default to Batam, participate in validation, and are included in the final workbook.

## Export compatibility

The redesigned application preserves:

- the exact workbook header order;
- sheet name `Sheet1`;
- output filename `MyRepublic_Pos_Batam_Batch.xlsx`;
- customer code `WSREPUBLIC02154B`;
- sender identity and origin values;
- service code `PKH` and sub-service code `915436`;
- shipment dimensions and weight;
- payment, item, return, and delivery-instruction values;
- destination zone logic;
- postcode transformation from a zone ending in `00` to a postcode ending in `11`.

Operational constants must not be changed without validating downstream compatibility and documenting the old value, new value, reason, and affected output rows.

## Privacy

Files and recipient records are processed in the browser. The application does not send recipient data to an application server, store recipient records permanently, include recipient information in URLs, or add analytics. SheetJS is loaded from its official CDN for Excel import and export; if that dependency fails to load, HTML and CSV parsing still work and the interface displays a clear Excel-library error.

## Local development

No build step or Node.js dependency is required.

```bash
python -m http.server 8080
```

Open `http://localhost:8080/` in a modern browser. Serving through HTTP is recommended because browser security rules can restrict local file behavior.

## Cloudflare Pages deployment

- Framework preset: **None**
- Build command: leave empty
- Build output directory: `/`
- Root directory: repository root

The repository is a static site and is directly deployable to Cloudflare Pages. `_headers` includes security and cache directives. Confirm that the custom domain points to the Pages project and that the template file is present at the repository root.

## Repository structure

```text
/
├── index.html
├── 404.html
├── assets/
│   ├── css/app.css
│   ├── js/app.js
│   ├── js/parser.js
│   ├── js/validation.js
│   └── js/export.js
├── Template_Input_MyRepublic_KCU_Batam.xlsx
├── favicon.svg
├── favicon-32x32.png
├── apple-touch-icon.png
├── og-cover.png
├── site.webmanifest
├── robots.txt
├── sitemap.xml
├── _headers
├── README.md
├── CHANGELOG.md
├── REGRESSION_TEST_REPORT.md
├── IMPLEMENTATION_SUMMARY.md
├── docs/
│   └── screenshots/
└── tests/
    ├── README.md
    └── automated-test-results.json
```

## Test evidence

The redesign passed **85 automated browser and static checks with zero failures**. Screenshots are stored in `docs/screenshots/`, and the detailed compatibility checklist is in `REGRESSION_TEST_REPORT.md`. Deployment-dependent production smoke checks are documented separately and should be completed after the Cloudflare Pages branch deployment is available.

## Known limitations

- Excel import and export require SheetJS to load from `cdn.sheetjs.com`.
- The destination city list intentionally preserves the city and zone values that existed in the original repository.
- BAST extraction remains dependent on the established `t02`, `t03`, and `t04` HTML structures, with safe warning fallbacks for partial files.
- Browser behavior for native datalist suggestions differs slightly across desktop and mobile browsers.
