# Regression Test Report

Date: 2026-07-28  
Target: MyRepublic Shipment Batch Generator redesign  
Automated result: **85 passed, 0 failed**

## Regression baseline

The original repository was audited before redesign. The following behavior was treated as immutable compatibility scope:

- drag-and-drop and file-picker upload;
- multiple-file staging, duplicate detection, individual removal, and batch processing;
- `.html`, `.htm`, `.xlsx`, `.xls`, and `.csv` support;
- BAST extraction from `table.t02`, `#t03`, and `#t04`;
- existing spreadsheet aliases for serial, reference, recipient, phone, address, and city;
- manual recipient creation and Batam as the operational default city;
- destination city-to-zone mapping;
- zone-ending `00` to postcode-ending `11` transformation;
- uppercase export normalization and numeric-only phone normalization;
- exact workbook headers, fixed operational constants, `Sheet1`, and `MyRepublic_Pos_Batam_Batch.xlsx`;
- standard input-template download.

## Automated browser and static checks

| Area | Result | Evidence |
|---|---:|---|
| Repository structure and required files | PASS | Static file scan; no build step or nested repository directory. |
| English-only interface | PASS | HTML/UI string scan and live browser checks. Operational workbook values intentionally remain unchanged. |
| Upload queue | PASS | File picker, drag-and-drop, multiple files, duplicate state, unsupported/empty states, remove one, remove all, progress, and persistent completion states. |
| HTML BAST parser | PASS | Name, phone, address, DO number, multiple serial numbers, partial selectors, warnings, and critical validation of missing fields. |
| CSV parser | PASS | Standard headers, alternate aliases, quoted cells, empty rows, malformed rows, unrecognized headers, and batch resilience. |
| XLSX/XLS application branches | PASS | Both branches exercised with a deterministic SheetJS interface; the standard `.xlsx` template also opens with OpenPyXL. A production-network test with a real legacy BIFF `.xls` sample remains recommended. |
| Record workspace | PASS | Manual add, Batam default, edit, search, status filter, select, bulk delete, individual delete, clear workspace, and source-file attribution. |
| Validation | PASS | Required fields, phone length, duplicate reference, duplicate serial, short address, unsupported city/characters, warning and blocking states. |
| City/postcode | PASS | Existing city map retained; `29400 → 29411` and equivalent `00 → 11` logic verified. |
| Export data | PASS | Exact header order, constants, row count, normalized values, numeric postcode/zone fields, `Sheet1`, and output filename verified. |
| Workbook invocation | PASS | SheetJS `json_to_sheet`, workbook append, compression option, sheet name, and download filename verified through the deterministic browser interface. |
| Desktop responsive layout | PASS | Chromium at 1440×1000 and 1920×1080; no page-level horizontal overflow; table overflow remains contained inside its scroll region. |
| Mobile responsive layout | PASS | Chromium at 390×844; editable rows become cards; no page-level horizontal overflow; footer remains 36 px. |
| Accessibility | PASS | Skip link, semantic landmarks, heading hierarchy, labels, native keyboard controls, visible focus, live regions, non-color status text, and reduced-motion CSS. |
| Footer | PASS | Template MILE structure and dimensions faithfully adapted: 38 px desktop, 36 px mobile, dark navy, orange top border, brand, center copy, and creator badge. |
| Console/privacy | PASS | No application JavaScript errors in tested paths; no recipient-record console logging or analytics. |
| SEO/security files | PASS | Canonical, OG/Twitter, SoftwareApplication JSON-LD, manifest, icons, robots, sitemap, 404, and Cloudflare `_headers`. |

## Mandatory 76-point checklist status

### Upload tests (1–13)

1. One HTML BAST file — PASS  
2. Several HTML BAST files — PASS by repeated/mixed HTML processing paths  
3. One XLSX file — PASS (deterministic SheetJS branch)  
4. One XLS file — PASS (deterministic legacy branch)  
5. One CSV file — PASS  
6. Mixed formats — PASS  
7. Drag and drop — PASS  
8. Browse/file picker — PASS  
9. Duplicate files — PASS  
10. Remove one queued file — PASS  
11. Remove all files — PASS  
12. Corrupt/invalid source — PASS for invalid spreadsheet structure and empty files; production real corrupt XLSX retest recommended  
13. Unsupported file — PASS

### BAST parsing tests (14–22)

14. Recipient name — PASS  
15. Phone number — PASS  
16. Address — PASS  
17. DO number — PASS  
18. One serial number — PASS through serial extraction path  
19. Multiple serial numbers — PASS  
20. Missing selectors — PASS  
21. Partial BAST data — PASS with warnings  
22. One bad source does not terminate other processing — PASS

### Spreadsheet tests (23–29)

23. Standard template — PASS  
24. Alternate column aliases — PASS  
25. Empty rows ignored — PASS  
26. Missing/unrecognized headers — PASS  
27. Invalid/malformed rows — PASS with warning and continuation  
28. Multiple spreadsheet files — PASS  
29. Record count — PASS

### Record workspace tests (30–41)

30. Edit every field — PASS  
31. Add manual recipient — PASS  
32. Delete recipient — PASS  
33. Search records — PASS  
34. Filter records — PASS  
35. Select destination city — PASS  
36. Search destination city/postcode — PASS through native searchable datalist  
37. Postcode transformation — PASS  
38. Required-field validation — PASS  
39. Phone normalization — PASS  
40. Duplicate serial validation — PASS  
41. Duplicate reference validation — PASS

### Export tests (42–54)

42. Export one record — PASS through deterministic SheetJS interface  
43. Export multiple records — PASS  
44. Workbook construction/openability — PASS for standard template and generated workbook interface; production download smoke test recommended  
45. Sheet name — PASS (`Sheet1`)  
46. Required headers — PASS  
47. Header order — PASS  
48. Fixed MyRepublic values — PASS  
49. Recipient values — PASS  
50. Postcode and zone — PASS  
51. Numeric field types — PASS  
52. Output filename — PASS  
53. No unwanted blank rows — PASS  
54. Old/new output compatibility — PASS by exact schema/constants comparison; final production same-input workbook diff remains recommended

### Responsive and accessibility tests (55–66)

55. Desktop — PASS  
56. Laptop — PASS through responsive breakpoint inspection  
57. Tablet — PASS through responsive breakpoint inspection  
58. Android portrait — PASS at 390 px mobile viewport  
59. iPhone portrait — PASS at 390 px mobile viewport  
60. Mobile landscape — PASS through no-overflow responsive rules  
61. Keyboard navigation — PASS  
62. Screen-reader labels — PASS  
63. Visible focus — PASS  
64. Reduced motion — PASS  
65. No horizontal page overflow — PASS  
66. No footer overlap — PASS

### Technical tests (67–76)

67. No JavaScript console errors — PASS in tested paths  
68. No broken local asset links — PASS  
69. Favicon present — PASS  
70. Template present — PASS  
71. No recipient data sent to unexpected servers — PASS by architecture/static review  
72. No sensitive data in console logs — PASS  
73. Cloudflare Pages configuration — PASS static configuration; live deployment verification pending publish  
74. Direct custom-domain access — pending Cloudflare deployment  
75. ZIP structure — PASS  
76. No nested duplicate repository folder — PASS

## Deployment-dependent verification

After Cloudflare Pages builds the branch or after merge, complete these final smoke checks:

- open the branch deployment and custom domain directly;
- confirm the official SheetJS CDN is reachable from the production network;
- import one real `.xlsx` and one real legacy BIFF `.xls` operational file;
- download the browser-generated workbook and open it in Microsoft Excel or LibreOffice;
- compare old and new workbooks using identical real input;
- inspect Cloudflare response headers and MIME types.

These checks depend on an unpublished deployment or real operational samples and are therefore not represented as completed production checks.
