# gongboo.org `/test`

`/test` is the content-production and quiz-verification environment. The production `/gongboo` files, GAS deployments, and Google Sheets are not changed from this workspace.

## Workflow

1. Add or edit questions in the test Google Sheet.
2. Use **JSON · LaTeX Preview** in `/test/index.html` to verify the `G` value and math text.
3. Select the automatically discovered subject and verify the complete quiz.
4. Promote a tested version to `/gongboo` only in a separate, explicitly approved operation.

## Environment policy

| Environment | Login | Data | Purpose |
|---|---|---|---|
| `/test` | Bypassed by `TEST_MODE` | Test GAS and test Sheet only | Production and verification |
| `/gongboo` | Existing login and authorization | Production GAS and Sheet | Live service |

`TEST_MODE=true` is intentionally limited to the test copies of `main.js` and `quiz_GAS.js`. Never copy that setting to the production GAS deployment.

## Files

- `index.html`: quiz UI, dynamic subject selector, JSON/LaTeX Preview panel
- `main.js`: quiz, math, graphic, test bootstrap, and preview behavior
- `login.html`: retained test member UI; `/test/index.html` no longer depends on it
- `quiz_GAS.js`: test question API and automatic question-sheet discovery
- `member_GAS.js`: existing member API; retained unchanged

## Automatic subjects

`quiz_GAS.js` enumerates spreadsheet sheets and exposes a sheet as a subject when its first row matches a supported question schema.

Excluded system sheet names:

- `member`
- `subjects`
- `history`
- `backup`
- `logs`
- `config`
- `settings`

Supported schemas are detected from the existing `SAT_HEADERS` and `LICENSE_HEADERS`. The subject code is generated from the sheet name. No hard-coded allowed-sheet list is required in `/test`.

## Maintenance map

| Area | Block | Contract / dependency |
|---|---|---|
| Test authentication bypass | `main.js` 2000 | `TEST_MODE`, `currentUser`, `fetchQuizApi_` |
| Dynamic subject bootstrap | `main.js` 3000 | Quiz GAS `action=subjects`, localStorage subject keys |
| Question loading | `main.js` 0700-0730 | `DATA_SHEET`, `CURRENT_SUBJECT`, `fetchQuizApi_` |
| Math/LaTeX | `main.js` 1105-1130 | `renderWithEditingMarks`, `autoWrapLatex`, MathJax |
| Graphic engine | `main.js` 1200-1290 | `parseGraphicPayload`, `renderGraphic`, renderer helpers |
| Test Preview | `main.js` 1490 and `index.html` 05 | Uses the same math and graphic functions as the quiz |
| Initialization | `main.js` 1510 | Test bootstrap must complete before `applySubjectConfig` |
| Dynamic subject API | `quiz_GAS.js` 4200 | Spreadsheet headers, system-sheet exclusion |

## Global compatibility rules

- Keep `currentUser`, `availableSubjects`, `subjectConfig`, `DATA_SHEET`, `currentQuestions`, `currentRenderToken`, `RendererManager`, and `chartInstances` compatible.
- Do not rename or remove `renderGraphic`, `renderCurrentQuestion`, `renderWithEditingMarks`, `ensureMathJax`, or exported `window` functions without checking all callers.
- Prefer minimal function-level edits over whole-block replacement.
- Record additions, changes, deletions, and verification after every release.

## Change log

### 8.1-test — 2026-07-20

- Added: login-free `/test` bootstrap and unrestricted test-question access.
- Added: dynamic subject discovery from valid question sheets.
- Added: on-page subject selector.
- Added: JSON Graphic Preview using the existing `parseGraphicPayload()` and `renderGraphic()` pipeline.
- Added: Math/LaTeX Preview using the existing `renderWithEditingMarks()` and MathJax pipeline.
- Changed: `/test` initialization waits for subject discovery before loading a quiz.
- Deleted: no existing quiz, graphic, math, member, or review feature.
- Production: `/gongboo` not changed.
