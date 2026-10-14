# WiFi Room — DOM Architecture

## 1. Scope and conventions

- Static interface specification before later NetBeans/JSP implementation.
- All visible text, titles, accessible names and placeholders are English. Vietnamese is reserved for comments.
- No external libraries, fonts, icon packs or chart packages. Future visuals use local CSS, inline SVG and native canvas.
- Each page has one `main`, one `h1`, named sections with `h2`, and card headings with `h3`. Use `div` for layout groups without an independent topic.
- `ComponentName` references a subtree defined below, not a custom HTML element. Expand it once per required instance. `[repeat]` means sibling instances with unique IDs; `[conditional]` means an alternative state.
- All values are illustrative and carry a `Demo data` label. Unknown results display `Not evaluated` or `Not measured`, not an invented percentage.
- Controls, dialogs, charts, filters and states are design specifications. This task does not implement authentication, CRUD, polling, export, chart rendering or classification.
- UI role restrictions describe presentation only; later server authorization remains necessary.

## 2. File plan and migration

```text
WifiRoom_ProjectLayout/
├── README.md               Updated architecture specification
├── login.html              Planned: standalone login
├── index.html              Existing: future dashboard only
├── area.html               Planned: areas and access points
├── survey.html             Planned: surveys and collection runs
├── sessions.html           Planned: session list and editor
├── session-detail.html     Planned: session inspection and review
├── analytics.html          Planned: statistics and fingerprints
├── style.css               Existing: shared styles at project root
└── main.js                 Existing: future local UI/chart behavior at root
```

The current `index.html` combines `main#landing-page.login-layout` and hidden `div#main-app`. The target design moves the landing interface to `login.html` and keeps the dashboard in `index.html`. Preserve the current login story, signal artwork and form styling. Replace `Explore the demo` with the account section below.

The workspace uses the horizontal `header.top-navbar` specified in this design. The existing sidebar is a migration reference, not a second menu to render alongside it. The shared header can later become a JSP include.

<!-- Giữ đường dẫn ./style.css và ./main.js đúng cấu trúc hiện tại; không dùng css/style.css hoặc js/drawChart.js và không tạo script trùng chức năng. -->

## 3. Shared DOM components

### DocumentHead

```text
head
├── meta[charset="UTF-8"]
├── meta[name="viewport", content="width=device-width, initial-scale=1.0"]
├── meta[name="theme-color", content="#153e39"]
├── meta[name="description", content={page description}]
├── title ("{Page name} | WiFi Room")
├── link[rel="stylesheet", href="./style.css"]                 [once]
└── script[src="./main.js", defer]                              [once; future behavior only]
```

### AppHeader — all workspace pages

```text
header.top-navbar
├── a.skip-link[href="#main-content"] ("Skip to main content")
├── div.nav-left
│   ├── a.brand[href="index.html", aria-label="WiFi Room dashboard"]
│   │   ├── span.brand-mark[aria-hidden="true"] > svg (local Wi-Fi icon)
│   │   └── span ("WiFi Room")
│   ├── button.menu-toggle[type="button", aria-controls="primary-navigation",
│   │                      aria-expanded="false"] ("Menu")     [narrow screens]
│   └── nav#primary-navigation[aria-label="Main navigation"]
│       └── ul.menu-links
│           ├── li > a[href="index.html"] ("Dashboard")
│           ├── li > a[href="area.html"] ("Areas & APs")
│           ├── li > a[href="survey.html"] ("Surveys")
│           ├── li > a[href="sessions.html"] ("Sessions")
│           └── li > a[href="analytics.html"] ("Analytics")
└── div.nav-right
    ├── span.demo-badge ("Demo workspace")
    ├── div.user-info > span.user-name ("Demo Administrator") + span.user-role ("ADMIN")
    └── button.logout-button[type="button"] ("Log out")
```

Exactly one link has `.active` and `aria-current="page"`. Session detail activates Sessions and uses a breadcrumb for its own location. Links navigate; buttons perform actions. The responsive menu reuses this navigation subtree.

### PageFeedback, Pagination, TableRegion and ChartFigure

```text
PageFeedback
├── div.toast-region[role="status", aria-live="polite", aria-atomic="true"]
│   └── div.toast                                                [conditional]
│       ├── p ("Changes saved.")
│       └── button[type="button", aria-label="Dismiss notification"] ("Dismiss")
└── div.page-error[role="alert"]                                 [conditional]
    ├── p ("This content could not be loaded.")
    └── button[type="button"] ("Try again")

Pagination                                                      [one per independent list]
└── nav.pagination[aria-label="{Entity} pagination"]
    ├── p ("Showing 1–20 of 1,250 {entities}")
    ├── label[for="{entity}-page-size"] ("Rows per page")
    ├── select#{entity}-page-size (20 | 50 | 100)
    └── ul.page-links
        ├── li > button[type="button", disabled at start] ("Previous")
        ├── li > button[type="button", aria-current="page"] ("1")
        ├── li > button[type="button"] ("2")                    [repeat as needed]
        └── li > button[type="button", disabled at end] ("Next")

TableRegion
└── div.table-scroll[role="region", tabindex="0", aria-label={table name}]
    └── table.data-table
        ├── caption ({table purpose; may be visually hidden})
        ├── thead > tr > th[scope="col"]                         [one per listed column]
        └── tbody > tr                                           [one per record]
            └── th[scope="row"] / td                            [one cell per column, same order]

ChartFigure
└── figure.chart-figure
    ├── div.canvas-container
    │   └── canvas#{unique-id}[role="img", aria-label={purpose}, aria-describedby={summary-id}]
    ├── figcaption#{summary-id} ({plain-language summary and units})
    └── details.chart-data
        ├── summary ("View chart data")
        └── TableRegion (same values as chart)
```

Each data list supports loading, empty, no-results and error states. Show the applicable state instead of fabricated records. Status badges include words, not color alone. A chart's table remains available when canvas is unsupported.

### EntityEditor and DeleteDialog

```text
EntityEditor
└── dialog#{entity}-editor[aria-labelledby="{entity}-editor-title"]
    ├── header.dialog-header
    │   ├── h2#{entity}-editor-title ("Add {entity}" / "Edit {entity}")
    │   └── button[type="button", aria-label="Close {entity} editor"] ("Close")
    └── form#{entity}-form
        ├── div.form-error-summary[role="alert"]                  [conditional]
        ├── fieldset
        │   ├── legend ({field group purpose})
        │   └── div.form-field                                   [repeat per listed field]
        │       ├── label[for={unique ID}] ({English field name})
        │       ├── input / select / textarea#{unique ID}
        │       ├── small#{field-id}-hint ({help text})            [optional]
        │       └── p#{field-id}-error ({validation message})     [conditional]
        └── footer.form-actions
            ├── button[type="button"] ("Cancel")
            └── button[type="submit"] ("Save changes")

DeleteDialog                                                    [one instance per page]
└── dialog#delete-dialog[aria-labelledby="delete-title", aria-describedby="delete-description"]
    ├── h2#delete-title ("Delete {entity}?")
    ├── p#delete-description ("Review this record before deleting it.")
    ├── dl (Record ID | Record name | Linked-record warning)
    ├── p.dependency-warning                                     [conditional; blocks invalid deletion]
    └── div.dialog-actions
        ├── button[type="button"] ("Cancel")
        └── button.danger[type="button"] ("Delete {entity}")
```

Reuse one editor per entity on a page for Add/Edit. A future dialog moves focus inside, contains keyboard focus, supports Escape and returns focus to its opener. Fields use associated labels, `required`/bounds where specified, `aria-describedby` for hints and errors, and `aria-invalid` for invalid input. This document does not implement validation or submission.

## 4. login.html — Log in

```text
html[lang="en"]
├── DocumentHead ("Log in | WiFi Room")
└── body.login-bg
    ├── a.skip-link[href="#login-form"] ("Skip to login")
    ├── svg.svg-defs[aria-hidden="true"] > defs                   [local decorative symbols]
    ├── main#main-content.login-layout
    │   ├── section.login-story[aria-labelledby="story-heading"]
    │   │   ├── a.brand[href="login.html"] (Wi-Fi icon + "WiFi Room.")
    │   │   ├── div.story-copy
    │   │   │   ├── p.eyebrow ("INDOOR POSITIONING WORKSPACE")
    │   │   │   ├── h1#story-heading ("A clearer view. A smarter space.")
    │   │   │   └── p ("Bring your rooms, tags, and positioning insights together.")
    │   │   ├── div.signal-art[aria-hidden="true"]
    │   │   │   ├── div.signal-ring.ring-one
    │   │   │   ├── div.signal-ring.ring-two
    │   │   │   ├── div.signal-center > svg (Wi-Fi icon)
    │   │   │   └── span.signal-label ("Room 01" … "Room 04")      [four labels]
    │   │   └── p.story-footer ("Connected spaces. Clearer insights.")
    │   └── section.login-panel[aria-labelledby="login-heading"]
    │       ├── header.login-heading
    │       │   ├── p.small-label ("YOUR WORKSPACE, SIMPLIFIED")
    │       │   ├── h2#login-heading ("Welcome back")
    │       │   └── p ("Log in to your positioning workspace.")
    │       ├── p#login-error[role="alert"] ("Invalid username or password.") [conditional]
    │       ├── form#login-form[aria-labelledby="login-heading"]
    │       │   ├── div.form-field
    │       │   │   ├── label[for="username"] ("Username")
    │       │   │   └── input#username[name="username", type="text", autocomplete="username", required]
    │       │   ├── div.form-field
    │       │   │   ├── label[for="password"] ("Password")
    │       │   │   └── div.password-field
    │       │   │       ├── input#password[name="password", type="password", autocomplete="current-password", required]
    │       │   │       └── button#password-toggle[type="button", aria-controls="password",
    │       │   │                                  aria-pressed="false"] ("Show password")
    │       │   └── button.login-submit[type="submit"] ("Log in to workspace")
    │       ├── hr.demo-divider
    │       ├── section.demo-accounts[aria-labelledby="demo-heading"]
    │       │   ├── h3#demo-heading ("Demo accounts")
    │       │   ├── p ("Choose one of the five demo roles.")
    │       │   ├── ul.demo-users
    │       │   │   ├── li > code ("admin") + span ("Administrator")
    │       │   │   ├── li > code ("map_manager") + span ("Map Manager")
    │       │   │   ├── li > code ("surveyor") + span ("Surveyor")
    │       │   │   ├── li > code ("reviewer") + span ("Reviewer")
    │       │   │   └── li > code ("viewer") + span ("Viewer")
    │       │   ├── p ("Shared demo password: ") > code ("123456")
    │       │   └── small ("Demo data is illustrative. Access depends on the selected role.")
    │       └── p.login-footer ("WiFi Room · Indoor positioning made simple")
    └── PageFeedback
```

States: default, invalid credentials, field errors, submitting (`Logging in…`, disabled submit), and a login-success toast on the destination dashboard. Do not render AppHeader on this page. A real login route is not wired in this design task.

## 5. index.html — Dashboard

```text
html[lang="en"]
├── DocumentHead ("Dashboard | WiFi Room")
└── body.workspace-page
    ├── AppHeader                                                [Dashboard active]
    ├── main#main-content.container.dashboard-container
    │   ├── header.page-header
    │   │   ├── h1 ("Workspace overview")
    │   │   ├── p ("Rooms, tag activity and positioning quality at a glance.")
    │   │   └── button[type="button"] ("Refresh")
    │   ├── section.kpi-row[aria-labelledby="kpi-heading"]
    │   │   ├── h2#kpi-heading.visually-hidden ("System summary")
    │   │   ├── article.kpi-card > h3 ("Total sessions") + p.kpi-value + small ("All stored sessions")
    │   │   ├── article.kpi-card > h3 ("Accuracy") + p.kpi-value + small ("Eligible device sessions")
    │   │   ├── article.kpi-card > h3 ("Missing-signal sessions") + p.kpi-value + small ("AP_LOST")
    │   │   └── article.kpi-card > h3 ("Current survey") + p.kpi-value + a[href="survey.html"] ("View surveys")
    │   ├── div.dashboard-grid                                  [layout only]
    │   │   ├── section.map-panel[aria-labelledby="map-heading"]
    │   │   │   ├── header.panel-header
    │   │   │   │   ├── h2#map-heading ("Live floor plan")
    │   │   │   │   ├── span ("Demo preview")
    │   │   │   │   └── a[href="area.html#area-editor"] ("Add area")
    │   │   │   ├── ul.map-legend (Area | Selected tag | Other tags | BORDER | AP_LOST | Offline)
    │   │   │   ├── figure.floorplan
    │   │   │   │   ├── canvas#floorplan-canvas[role="img", aria-label="Room layout and tags", aria-describedby="floorplan-summary"]
    │   │   │   │   └── figcaption#floorplan-summary ("Four rooms; illustrative tag positions.")
    │   │   │   └── ul.area-summary > li (Code | Size | Coordinates | Tags) [repeat per area; text alternative]
    │   │   └── section.tag-panel[aria-labelledby="tag-heading"]
    │   │       ├── h2#tag-heading ("Selected tag")
    │   │       ├── label[for="selected-tag"] ("Tag")
    │   │       ├── select#selected-tag (TAG-01 | TAG-02 | TAG-03)
    │   │       ├── p.tag-status (Online | Offline | No readings | Demo data)
    │   │       ├── dl (Tag code | Current label | Measured at | Received at | Confidence)
    │   │       ├── p ("No room assigned while BORDER or AP_LOST.") [conditional]
    │   │       └── a[href="sessions.html"] ("View tag sessions")
    │   ├── section.tag-list[aria-labelledby="tags-heading"]
    │   │   ├── h2#tags-heading ("All tags")
    │   │   ├── p.updated-at ("Last updated: —")
    │   │   └── ul.tag-cards > li > article.tag-card              [repeat per tag]
    │   │       ├── h3 ("TAG-01")
    │   │       ├── p (Connection state | Current label | Measured time)
    │   │       └── button[type="button", aria-label="Select TAG-01"] ("Select tag")
    │   ├── section.hourly-sessions[aria-labelledby="hourly-heading"]
    │   │   ├── h2#hourly-heading ("Sessions by hour")
    │   │   ├── label[for="activity-date"] ("Date") + input#activity-date[type="date"]
    │   │   └── ChartFigure (#hourly-chart-canvas; hours versus session count)
    │   └── section.alert-summary[aria-labelledby="alerts-heading"]
    │       ├── h2#alerts-heading ("Recent alerts")
    │       └── ul.alert-list > li > article.alert-card           [repeat]
    │           ├── h3 (Rule name)
    │           ├── p (Severity | Message | Time | Tag)
    │           └── a[href="session-detail.html"] ("Inspect session")
    ├── footer.page-footer ("WiFi Room · Demo workspace")
    └── PageFeedback
```

States: no current survey, no eligible device accuracy, no areas, no alerts, no tag reading, offline tag, BORDER and AP_LOST. Unknown positions appear outside room cells rather than in a guessed room. The Add area link specifies an editor entry state; later navigation must resolve it. Alert cards are a short summary, not a second complete alert-management page.

## 6. area.html — Areas & APs

```text
html[lang="en"]
├── DocumentHead ("Areas & APs | WiFi Room")
└── body.workspace-page
    ├── AppHeader                                                [Areas & APs active]
    ├── main#main-content.container
    │   ├── header.page-header
    │   │   ├── h1 ("Areas & access points")
    │   │   └── p ("Configure room geometry and the four positioning access points.")
    │   ├── section.area-list[aria-labelledby="areas-heading"]
    │   │   ├── header.section-header > h2#areas-heading ("Areas") + button ("Add area")
    │   │   ├── form.area-filters[role="search"]
    │   │   │   ├── label[for="area-query"] ("Search areas") + input#area-query[type="search"]
    │   │   │   └── button[type="submit"] ("Search") + button[type="reset"] ("Clear")
    │   │   ├── div.area-grid > article.area-card                 [repeat]
    │   │   │   ├── h3 ("ROOM_1 · Room 1")
    │   │   │   ├── dl (Code | Name | Width × Height in m | X,Y in m | Notes)
    │   │   │   ├── p ("APs physically placed here: AP_01")        [optional placement summary]
    │   │   │   └── div.card-actions > button ("Edit area") + button ("Delete area")
    │   │   └── Pagination (Areas)
    │   ├── section.ap-list[aria-labelledby="aps-heading"]
    │   │   ├── header.section-header > h2#aps-heading ("Access points") + button ("Add AP")
    │   │   ├── p ("RSSI slots 1–4 identify the same four APs in every room.")
    │   │   ├── form.ap-filters
    │   │   │   ├── label + input#ap-query[type="search"] ("Search APs")
    │   │   │   ├── label + select#ap-status (All | Enabled | Disabled | Moved)
    │   │   │   └── button[type="submit"] ("Apply filters") + button[type="reset"] ("Clear")
    │   │   ├── TableRegion ("Access point configuration")
    │   │   │   └── Columns: Slot | Code | SSID | Placement | X | Y | Enabled | Moved | Actions
    │   │   │       Row: one AP; Code is the row header; Actions = Edit AP / Delete AP buttons
    │   │   └── Pagination (Access points)
    │   └── section.configuration-notes
    │       ├── h2 ("Positioning setup")
    │       └── p ("Additional areas can be managed; the experiment classifies ROOM_1–ROOM_4.")
    ├── EntityEditor (#area-editor; "Area details")
    │   └── Fields: Code[text, required], Name[text, required], X[number, m], Y[number, m],
    │               Width[number, >0, m], Height[number, >0, m], Notes[textarea]
    ├── EntityEditor (#ap-editor; "Access point details")
    │   └── Fields: Slot[select 1–4, unique], Code[text], SSID[text, required],
    │               Placement[area or Unassigned], X[number, m], Y[number, m],
    │               Enabled[checkbox], Moved[checkbox], Notes[textarea]
    ├── DeleteDialog                                            [area/AP context]
    └── PageFeedback
```

States: empty lists, no results, unavailable AP slot, duplicate code, invalid dimensions and deletion blocked by references. `Enabled` describes configuration, not live reachability; keep any `Missing signal` observation distinct.

## 7. survey.html — Surveys

```text
html[lang="en"]
├── DocumentHead ("Surveys | WiFi Room")
└── body.workspace-page
    ├── AppHeader                                                [Surveys active]
    ├── main#main-content.container
    │   ├── header.page-header > h1 ("Surveys") + button ("Create survey")
    │   ├── section.survey-list[aria-labelledby="surveys-heading"]
    │   │   ├── h2#surveys-heading ("Survey history")
    │   │   ├── form.survey-filters
    │   │   │   ├── label + input#survey-query[type="search"] ("Search surveys")
    │   │   │   ├── label + select#survey-state (All | Current map | Open | Finished)
    │   │   │   └── button[type="submit"] ("Apply filters") + button[type="reset"] ("Clear")
    │   │   ├── TableRegion ("Survey history")
    │   │   │   └── Columns: Code | Name | Sessions | Condition | Accuracy | Calibrated at | Finished at | Current map | Actions
    │   │   │       Row: one survey; Code is the row header; all nine cells are present
    │   │   │       Actions: Edit / Delete / Use as current map / Record calibration / Finish survey buttons
    │   │   │                + a[href="analytics.html"] ("View fingerprints")
    │   │   └── Pagination (Surveys)
    │   ├── section.collection-setup[aria-labelledby="collection-heading"]
    │   │   ├── h2#collection-heading ("Collect labeled sessions")
    │   │   ├── p ("Choose the actual room and condition before collecting with a tag.")
    │   │   └── form#collection-form
    │   │       ├── fieldset > legend ("Collection context")
    │   │       │   └── Fields: Tag[TAG-01–TAG-03], Survey[select], Actual room[ROOM_1–ROOM_4],
    │   │       │               Condition[SURVEY | IMMEDIATE | BORDER | AFTER_3H | AP_MOVED | CROWDED | AP_LOST]
    │   │       ├── p.form-error[role="alert"]                    [conditional]
    │   │       └── button[type="submit"] ("Start collection")
    │   └── section.collection-history[aria-labelledby="collections-heading"]
    │       ├── h2#collections-heading ("Collection runs")
    │       ├── TableRegion ("Collection runs")
    │       │   └── Columns: Tag | Survey | Actual room | Condition | Started at | Stopped at | State | Actions
    │       │       Row: one run; Actions = Stop collection button for active runs
    │       └── Pagination (Collection runs)
    ├── EntityEditor (#survey-editor; "Survey details")
    │   └── Fields: Code[text, required], Name[text, required], Condition[select],
    │               Started at[datetime-local], Notes[textarea]
    ├── dialog#survey-action[aria-labelledby="survey-action-title"]
    │   ├── h2#survey-action-title ("Change current map?" / "Record calibration?" / "Finish survey?")
    │   ├── p (Selected survey and effect of the action)
    │   ├── p.warning ("Stop active collections before finishing this survey.") [conditional]
    │   └── div.dialog-actions > button ("Cancel") + button ("Confirm")
    ├── DeleteDialog
    └── PageFeedback
```

States: no surveys, no current map, no eligible evaluation readings, tag already collecting, finished survey and linked sessions preventing deletion. Current-map status is separate from Open/Finished status; marking a map current does not finish its survey. Already-current and ineligible actions are disabled with an explanation. Keep training count separate from independent accuracy.

## 8. sessions.html — Sessions

```text
html[lang="en"]
├── DocumentHead ("Sessions | WiFi Room")
└── body.workspace-page
    ├── AppHeader                                                [Sessions active]
    ├── main#main-content.container
    │   ├── header.page-header
    │   │   ├── h1 ("Positioning sessions")
    │   │   └── div.page-actions > button ("Add sample session") + button ("Export filtered CSV")
    │   ├── section.filter-bar[aria-labelledby="filters-heading"]
    │   │   ├── h2#filters-heading ("Filter sessions")
    │   │   └── form#session-filters
    │   │       ├── fieldset > legend ("Session filters")
    │   │       │   └── Fields: Search[text], Tag[All + tags], Survey[All + surveys],
    │   │       │               Current label[All | ROOM_1 | ROOM_2 | ROOM_3 | ROOM_4 | BORDER | AP_LOST],
    │   │       │               Label source[All | RULE | REVIEWER], Actual room[All + four rooms],
    │   │       │               Data source[All | DEVICE | SYNTHETIC | UCI],
    │   │       │               Condition[All | SURVEY | IMMEDIATE | BORDER | AFTER_3H | AP_MOVED | CROWDED | AP_LOST | LIVE | UCI],
    │   │       │               Inclusion[All | Included | Excluded], Only mismatches[checkbox]
    │   │       └── div.form-actions > button[type="submit"] ("Apply filters") + button[type="reset"] ("Clear filters")
    │   ├── section.session-data[aria-labelledby="sessions-heading"]
    │   │   ├── header.section-header > h2#sessions-heading ("Session results") + p (Result count)
    │   │   ├── TableRegion ("Filtered positioning sessions")
    │   │   │   └── Columns: ID | Tag | Measured at | RSSI 1 | RSSI 2 | RSSI 3 | RSSI 4 | Confidence | Actual room | Machine label | Current label | Label source | Data source | Included | Actions
    │   │   │       Row: 15 matching cells; ID is row header/link; RSSI uses dBm; confidence uses %
    │   │   │       Actions: a[href="session-detail.html"] ("View details") + Edit / Delete buttons
    │   │   └── Pagination (Sessions)
    │   └── p.data-note ("New manual sessions are sample data, not device measurements.")
    ├── EntityEditor (#session-editor; "Session readings")
    │   └── Fields: Tag[select], RSSI 1–4[number, −100…−1 dBm, required],
    │               Actual room[Unknown + ROOM_1–ROOM_4], Survey[select], Map survey[select],
    │               Condition[select], Reason[textarea, required]
    │       Hint: "−100 represents a missing signal. New records are marked SYNTHETIC."
    ├── DeleteDialog                                            [warn about linked labels/alerts]
    └── PageFeedback
```

States: loading, no records, no matching results, invalid filter, no exportable rows and save/delete failures. The summary, pagination and export refer to the same filtered result set. Wide tables scroll inside their own region, not across the whole page.

## 9. session-detail.html — Session details

```text
html[lang="en"]
├── DocumentHead ("Session #1234 | WiFi Room")
└── body.workspace-page
    ├── AppHeader                                                [Sessions active]
    ├── main#main-content.container
    │   ├── nav.breadcrumb[aria-label="Breadcrumb"]
    │   │   └── ol
    │   │       ├── li > a[href="sessions.html"] ("Sessions")
    │   │       └── li[aria-current="page"] ("Session #1234")
    │   ├── header.page-header > h1 ("Session #1234") + a[href="sessions.html"] ("Back to sessions")
    │   ├── section.session-summary[aria-labelledby="summary-heading"]
    │   │   ├── h2#summary-heading ("Session information")
    │   │   ├── dl (Tag | Sequence | Measured at | Received at | Survey | Map survey | Condition |
    │   │   │       Actual room | Machine label | Current label | Label source | Confidence | Data source | Included)
    │   │   └── p.mismatch-note ("The machine label differs from the actual room.") [conditional]
    │   ├── section.chart-area[aria-labelledby="signal-heading"]
    │   │   ├── h2#signal-heading ("Signal comparison")
    │   │   ├── label + select#comparison-room (ROOM_1 | ROOM_2 | ROOM_3 | ROOM_4)
    │   │   ├── ul.chart-legend (This session | Selected room fingerprint)
    │   │   └── ChartFigure (#rssi-chart; four readings vs selected room means, dBm)
    │   ├── section.reviewer-panel[aria-labelledby="review-heading"]
    │   │   ├── h2#review-heading ("Review label")
    │   │   ├── p ("Reviewing preserves the machine result and appends a new history entry.")
    │   │   └── form#review-form                                 [ADMIN/REVIEWER]
    │   │       ├── label[for="review-label"] ("Correct label")
    │   │       ├── select#review-label[required] (ROOM_1 | ROOM_2 | ROOM_3 | ROOM_4 | BORDER | AP_LOST)
    │   │       ├── label[for="review-reason"] ("Reason")
    │   │       ├── textarea#review-reason[required, minlength="5"]
    │   │       ├── p.field-error[role="alert"]                  [conditional]
    │   │       └── button[type="submit"] ("Save reviewed label")
    │   ├── section.inclusion-panel[aria-labelledby="inclusion-heading"]
    │   │   ├── h2#inclusion-heading ("Statistical inclusion")
    │   │   ├── p (Included / Excluded and reason)
    │   │   └── form#inclusion-form
    │   │       ├── label + textarea#inclusion-reason[required] ("Reason")
    │   │       └── button[type="submit"] ("Exclude session" / "Restore session")
    │   ├── section.label-history[aria-labelledby="history-heading"]
    │   │   ├── h2#history-heading ("Label history")
    │   │   ├── TableRegion ("Label history")
    │   │   │   └── Columns: Recorded at | Label | Source | Reviewer | Reason
    │   │   └── Pagination (Label history)
    │   └── section.session-alerts[aria-labelledby="session-alerts-heading"]
    │       ├── h2#session-alerts-heading ("Related alerts")
    │       ├── TableRegion ("Related alerts")
    │       │   └── Columns: Rule | Severity | Message | Created at | State | Resolution note
    │       └── Pagination (Related alerts)
    └── PageFeedback
```

States: not found with a Back link, no fingerprint, missing AP, read-only review notice, empty history, excluded session and no alerts. Show `−100 / Missing` distinctly rather than as an ordinary valid observation. Session editing/deletion stays on Sessions to avoid another editor copy here.

## 10. analytics.html — Analytics

```text
html[lang="en"]
├── DocumentHead ("Analytics | WiFi Room")
└── body.workspace-page
    ├── AppHeader                                                [Analytics active]
    ├── main#main-content.container
    │   ├── header.page-header > h1 ("Positioning analytics") + button ("Export filtered CSV")
    │   ├── section.analysis-filters[aria-labelledby="analysis-filters-heading"]
    │   │   ├── h2#analysis-filters-heading ("Analysis scope")
    │   │   └── form#analysis-filters
    │   │       ├── label + select#analysis-source (DEVICE | SYNTHETIC | UCI)
    │   │       ├── label + select#analysis-survey (Current map | All maps | Named maps)
    │   │       └── button[type="submit"] ("Apply scope")
    │   ├── p.scope-note ("Training, LIVE, missing-signal and excluded sessions do not count toward accuracy.")
    │   ├── p.demo-note ("This source is not a hardware measurement from your group.") [SYNTHETIC/UCI]
    │   ├── section.accuracy-summary[aria-labelledby="accuracy-heading"]
    │   │   ├── h2#accuracy-heading ("Accuracy overview")
    │   │   └── div.metric-grid
    │   │       ├── article > h3 ("Overall accuracy") + p (Percentage or "Not evaluated")
    │   │       ├── article > h3 ("Eligible sessions") + p (Count)
    │   │       ├── article > h3 ("Correct predictions") + p (Count)
    │   │       └── article > h3 ("Excluded sessions") + p (Count)
    │   ├── section.condition-comparison[aria-labelledby="conditions-heading"]
    │   │   ├── h2#conditions-heading ("Accuracy by condition")
    │   │   ├── TableRegion ("Four-condition comparison")
    │   │   │   └── Columns: Condition | Eligible sessions | Correct | Accuracy | Change from immediate
    │   │   │       Rows: IMMEDIATE | AFTER_3H | AP_MOVED | CROWDED
    │   │   ├── ChartFigure (#condition-chart; condition versus accuracy, %)
    │   │   └── p ("Changes use percentage points. Missing conditions are Not measured.")
    │   ├── section.confusion-matrix[aria-labelledby="matrix-heading"]
    │   │   ├── h2#matrix-heading ("Actual room vs. machine prediction")
    │   │   ├── TableRegion ("Confusion matrix")
    │   │   │   └── Columns: Actual / Predicted | ROOM_1 | ROOM_2 | ROOM_3 | ROOM_4 | BORDER | Evaluated | Room accuracy
    │   │   │       Rows: ROOM_1–ROOM_4; actual room is the row header; counts then total and accuracy
    │   │   └── p ("BORDER is not a correct room prediction. AP_LOST is reported separately.")
    │   ├── section.fingerprint-stats[aria-labelledby="fingerprint-heading"]
    │   │   ├── h2#fingerprint-heading ("Room fingerprints")
    │   │   ├── p ("Survey readings only. Values closer to zero mean a stronger signal.")
    │   │   ├── TableRegion ("Mean RSSI and sample standard deviation")
    │   │   │   └── Columns: Room | Survey samples | AP 1 mean ± SD | AP 2 mean ± SD | AP 3 mean ± SD | AP 4 mean ± SD
    │   │   ├── ChartFigure (#fingerprint-chart; room-by-AP means, dBm)
    │   │   └── p.thin-survey-note ("Fewer than 50 valid survey readings in this room.") [conditional]
    │   ├── section.label-distribution[aria-labelledby="distribution-heading"]
    │   │   ├── h2#distribution-heading ("Machine label distribution")
    │   │   ├── ChartFigure (#label-chart; six labels versus session counts)
    │   │   └── dl (All sessions in scope | BORDER count and percentage | AP_LOST count and percentage)
    │   ├── section.review-transport[aria-labelledby="quality-heading"] [DEVICE only]
    │   │   ├── h2#quality-heading ("Review and delivery quality")
    │   │   └── dl (Reviewed sessions | Review percentage | Delayed arrivals | Mean delay | Maximum delay)
    │   ├── section.baseline-comparison[aria-labelledby="baseline-heading"]
    │   │   ├── h2#baseline-heading ("UCI baseline and device results")
    │   │   ├── p ("UCI 422 · Columns 1–4 · Seed 301 · 1,400 training / 600 test samples")
    │   │   ├── TableRegion ("Baseline comparison")
    │   │   │   └── Columns: Dataset | Training samples | Test samples | Accuracy | Notes
    │   │   │       Rows: UCI holdout | Device experiment
    │   │   └── p ("Dataset and environment differences limit direct comparison.")
    │   └── section.experiment-progress[aria-labelledby="progress-heading"]
    │       ├── h2#progress-heading ("Real-data collection progress")
    │       ├── TableRegion ("Required experiment sessions")
    │       │   └── Columns: Condition | Collected | Required | State
    │       │       Rows: SURVEY/400 | IMMEDIATE/200 | BORDER/80 | AFTER_3H/150 | AP_MOVED/120 | CROWDED/120 | AP_LOST/60
    │       └── p ("Counts alone do not confirm elapsed time, AP placement or experimental conditions.")
    └── PageFeedback
```

States: no eligible results, missing conditions, insufficient survey readings, no selected fingerprint map and absent device results. Show `Not measured`/`Not evaluated` rather than `0%` when a denominator is unavailable. Fingerprints require one selected map; All maps shows a selection prompt for that panel instead of pooling incompatible maps. UCI has no four-condition experiment: show its holdout result and a not-applicable state for condition comparison.

## 11. Role presentation and responsive behavior

| Action                                         | ADMIN | MAP_MANAGER | SURVEYOR | REVIEWER | VIEWER |
| ---------------------------------------------- | :---: | :---------: | :------: | :------: | :----: |
| Read pages and export CSV                      |  Yes  |     Yes     |   Yes    |   Yes    |  Yes   |
| Manage areas, APs, surveys and collection runs |  Yes  |     Yes     |   Yes    |    No    |   No   |
| Add/delete sample sessions                     |  Yes  |     No      |    No    |    No    |   No   |
| Edit session readings                          |  Yes  |     Yes     |   Yes    |    No    |   No   |
| Review labels with a reason                    |  Yes  |     No      |    No    |   Yes    |   No   |
| Exclude/restore sessions                       |  Yes  |     Yes     |   Yes    |   Yes    |   No   |

This is UI presentation, not working authorization. Account/device administration screens are outside the seven-page layout requested here; listing demo roles does not imply an additional administration page.

- Desktop: horizontal navigation, four KPI cards, map and tag panel side by side.
- Tablet: two KPI columns; map and tag panels may stack without changing reading order.
- Mobile: one-column sections, one collapsible navigation, full-width forms/dialogs, horizontal scroll inside labeled table regions.
- Preserve visible focus, readable contrast, associated labels, unique IDs and usable control sizes.
- Future live refresh must not move keyboard focus or announce unchanged metrics repeatedly.
- All field inventories expand using EntityEditor's label/control/hint/error pattern, even in inline filter forms. `label + control` always means an explicit `for`/ID association.
- `dl` inventories expand into `dt`/`dd` pairs; legends expand into `li` items. Table column inventories expand into the TableRegion structure with matching header/body cell counts.
- Unspecified action buttons use `type="button"`. Save/filter buttons inside forms use `type="submit"` explicitly. Avoid nested forms.
- Record links will later carry a record identifier; scope/filter links will carry their selection. The plain filenames here specify destinations without inventing working routing.

## 12. Resolution checklist

| Original item                     | Architecture outcome                               | Implementation state |
| --------------------------------- | -------------------------------------------------- | -------------------- |
| Inspect files and missing pages   | Root-only file plan and migration mapping          | No files added       |
| Split large DOM blocks            | Shared semantic components and page sections       | No HTML changed      |
| Complete login from current index | Story, artwork, form, errors, five roles           | Design only          |
| Replace Explore the demo          | Account list below divider, outside form           | Design only          |
| Complete Dashboard                | KPIs, map, tag details, hourly chart, alerts       | Design only          |
| Complete Areas & APs              | Separate lists and two reusable editors            | Design only          |
| Complete Surveys                  | Matching columns, lifecycle, collection context    | Design only          |
| Complete Sessions                 | Full filters, table, pagination and editor         | Design only          |
| Complete Session Details          | Comparison, review history and exclusion           | Design only          |
| Complete Analytics                | Accuracy, matrix, fingerprints, baseline, progress | Design only          |

<!-- Chỉ triển khai giao diện sau khi người dùng yêu cầu. Không tự chuyển sang viết HTML sau lượt hoàn thiện sơ đồ này. -->

## 13. TODO — Danh sách giao việc triển khai giao diện

Danh sách dưới đây là công việc **chưa thực hiện**, được chia nhỏ theo sơ đồ DOM phía trên. Mọi đường dẫn tương đối đều tính từ `D:\Nguyen\PRJ301\Project\WifiRoom_ProjectLayout`. Đây là dự án demo giao diện; không chỉnh sửa dự án NetBeans `WifiRoom` trong các TODO này.

Cách gọi: **“Làm TODO-01”** hoặc **“Chỉnh lại TODO-01: …”**. Mỗi lần chỉ làm TODO được chỉ định, báo kết quả và dừng để người dùng kiểm tra; không tự chuyển sang TODO khác. Chỉ đánh dấu `[x]` khi người dùng xác nhận đạt. Nếu thiếu bước phụ thuộc, báo rõ thay vì tự thực hiện thêm. Việc viết danh sách này không đồng nghĩa với triển khai các mục bên dưới.

Phạm vi chung: giữ sơ đồ DOM đã chốt; nội dung giao diện bằng tiếng Anh; không thêm thư viện ngoài, folder mới, backend, database, xác thực thật hay thuật toán định vị. Các form, bộ lọc, nút lưu/xóa/xuất dữ liệu chỉ được trình bày hoặc mô phỏng giao diện, không thực hiện nghiệp vụ thật. Không tự tái cấu trúc phần ngoài TODO được giao.

### A. Chuẩn bị file

- [x] **TODO-01 — Tạo các file trang còn thiếu.** Tại thư mục gốc, tạo `login.html`, `area.html`, `survey.html`, `sessions.html`, `session-detail.html`, `analytics.html` nếu chưa tồn tại. Chỉ thêm bộ khung tài liệu theo DocumentHead, tiêu đề riêng và một `main` rỗng; tham chiếu `./style.css`, chưa chạy `main.js` trên các trang mới. **Đạt khi:** đủ sáu file mới, mở được từng file, không ghi đè nội dung file đã có hoặc sửa `index.html`.

- [x] **TODO-02 — Tách giao diện đăng nhập hiện có sang trang riêng.** Trong `login.html` và `index.html`, chuyển phần `#landing-page` cùng các icon cần dùng từ index sang login theo mục 4; giữ nguyên cách trình bày hiện tại trong bước này. **Cần:** TODO-01. **Đạt khi:** login chứa giao diện đăng nhập; index chỉ giữ workspace và hiển thị được độc lập, không còn khối đăng nhập ẩn/trùng.

- [x] **TODO-03 — Rà soát script cũ cho các trang đã tách.** Trong `main.js`, `login.html`, `index.html`, chỉ điều chỉnh việc khởi tạo theo phần tử thực sự có trên trang; bỏ phụ thuộc bắt buộc vào hai khối login/workspace cùng tồn tại. Không bổ sung nghiệp vụ đăng nhập. **Cần:** TODO-02. **Đạt khi:** mở login/index riêng không phát sinh lỗi JavaScript do thiếu phần tử; liên kết script tại mỗi trang tối đa một lần.

### B. Thành phần giao diện dùng chung

- [x] **TODO-04 — Dựng thanh điều hướng mẫu trên Dashboard.** Tại `index.html`, thay navigation cũ bằng AppHeader ở mục 3, đủ năm liên kết, thông tin người dùng, Demo workspace và Log out; cập nhật `style.css` cho phần này. **Cần:** TODO-02. **Đạt khi:** chỉ có một menu chính và Dashboard được đánh dấu active; không sửa nội dung dashboard ở bước này.

- [x] **TODO-05 — Áp dụng thanh điều hướng cho năm trang workspace còn lại.** Tại `area.html`, `survey.html`, `sessions.html`, `session-detail.html`, `analytics.html`, thêm AppHeader theo mẫu TODO-04 và đặt active đúng trang; không đưa header này vào login. **Cần:** TODO-01, TODO-04. **Đạt khi:** các liên kết trỏ đúng file; session detail active Sessions.

- [x] **TODO-06 — Chuẩn hóa khung trình bày chung.** Trong `style.css`, thêm/chỉnh style cho `.container`, `.page-header`, section, card, khoảng cách và phân cấp h1/h2/h3 theo giao diện đang có. **Cần:** TODO-04. **Đạt khi:** khung chung dễ đọc và nhất quán; không đổi bố cục DOM hoặc thiết kế lại thương hiệu.

- [x] **TODO-07 — Thiết kế các kiểu điều khiển chung.** Trong `style.css`, bổ sung style cho button, link hành động, label, input, select, textarea, checkbox, hint và lỗi trường. **Cần:** TODO-06. **Đạt khi:** phân biệt được primary/secondary/danger/disabled/focus; chưa xử lý dữ liệu form.

- [x] **TODO-08 — Thiết kế bảng và phân trang dùng chung.** Trong `style.css`, bổ sung style cho TableRegion và Pagination ở mục 3. **Cần:** TODO-06. **Đạt khi:** header/body rõ ràng, trang hiện tại và nút disabled có trạng thái riêng, bảng rộng cuộn trong vùng bảng.

- [x] **TODO-09 — Thiết kế khung dialog dùng chung.** Trong `style.css`, bổ sung style cho EntityEditor và DeleteDialog, gồm header, vùng form, lỗi, cảnh báo và footer nút. **Cần:** TODO-07. **Đạt khi:** style tái sử dụng được cho dialog các trang; không tạo chức năng lưu/xóa hoặc mở dialog tự động.

- [x] **TODO-10 — Thiết kế thông báo và trạng thái dữ liệu.** Trong `style.css`, bổ sung style cho PageFeedback, badge, loading, empty, no-results và error. **Cần:** TODO-06. **Đạt khi:** các trạng thái có chữ giải thích, không chỉ phân biệt bằng màu; chưa gắn xử lý sự kiện.

### C. Login — mục 4 của sơ đồ

- [x] **TODO-11 — Hoàn thiện phần giới thiệu đăng nhập.** Tại `login.html`, `style.css`, hoàn thiện `.login-story`, brand, tiêu đề, mô tả, signal-art bốn phòng và footer theo mục 4. **Cần:** TODO-02, TODO-06. **Đạt khi:** giữ tinh thần giao diện gốc, nội dung tiếng Anh, hình trang trí không gây nhiễu trình đọc màn hình.

- [x] **TODO-12 — Hoàn thiện form đăng nhập.** Tại `login.html`, `style.css`, thêm đúng label/input, nút Show password, nút Log in và vị trí thông báo lỗi theo sơ đồ. **Cần:** TODO-07, TODO-11. **Đạt khi:** có thể kiểm tra bố cục default/error/submitting bằng trạng thái mẫu; chưa thực hiện xác thực hay gửi form.

- [x] **TODO-13 — Thay Explore the demo bằng tài khoản mẫu.** Tại `login.html`, `style.css`, thêm đường phân cách và danh sách `admin`, `map_manager`, `surveyor`, `reviewer`, `viewer` với mật khẩu chung `123456`. **Cần:** TODO-12. **Đạt khi:** danh sách nằm ngoài form, dưới đường phân cách; không còn Explore the demo hoặc tài khoản không thuộc danh sách.

### D. Dashboard — mục 5 của sơ đồ

- [x] **TODO-14 — Hoàn thiện tiêu đề và bốn KPI.** Tại `index.html`, `style.css`, dựng page-header, Refresh và bốn card Total sessions, Accuracy, Missing-signal sessions, Current survey. **Cần:** TODO-04, TODO-06. **Đạt khi:** nhãn và chú thích đúng sơ đồ, giá trị mẫu được nhận diện rõ, thiếu accuracy hiển thị Not evaluated.

- [x] **TODO-15 — Hoàn thiện panel sơ đồ không gian.** Tại `index.html`, `style.css`, thêm map heading, Add area, legend, canvas, figcaption và danh sách khu vực thay thế bằng chữ. **Cần:** TODO-14. **Đạt khi:** đủ chỗ trình bày bốn phòng và các trạng thái BORDER/AP_LOST/Offline; chưa vẽ hoặc tính vị trí thật.

- [x] **TODO-16 — Hoàn thiện panel thẻ được chọn.** Tại `index.html`, `style.css`, thêm bộ chọn TAG-01–TAG-03, trạng thái và các cặp thông tin thời gian/nhãn/confidence. **Cần:** TODO-15. **Đạt khi:** panel cạnh bản đồ đúng sơ đồ; có mẫu No readings và vị trí không xác định; chưa polling hoặc cập nhật dữ liệu.

- [x] **TODO-17 — Hoàn thiện danh sách tất cả thẻ.** Tại `index.html`, `style.css`, thêm section All tags, thời điểm cập nhật, ba thẻ mẫu và nút Select tag. **Cần:** TODO-16. **Đạt khi:** mỗi thẻ có mã, trạng thái, nhãn, thời điểm đo và tên nút truy cập được; không trùng ID.

- [x] **TODO-18 — Hoàn thiện section biểu đồ theo giờ.** Tại `index.html`, `style.css`, thêm chọn ngày và ChartFigure cho Sessions by hour, gồm canvas, chú thích và bảng số liệu mẫu. **Cần:** TODO-08, TODO-17. **Đạt khi:** trục/đơn vị và số liệu thay thế rõ ràng; chưa cần viết hàm vẽ canvas.

- [x] **TODO-19 — Hoàn thiện cảnh báo và phản hồi Dashboard.** Tại `index.html`, `style.css`, thêm Recent alerts, link chi tiết phiên, footer và PageFeedback; trình bày mẫu no-alerts/no-map. **Cần:** TODO-10, TODO-18. **Đạt khi:** dashboard đủ các section của mục 5; chỉ là thông tin cảnh báo mẫu, không chạy luật cảnh báo.

### E. Areas & APs — mục 6 của sơ đồ

- [x] **TODO-20 — Hoàn thiện danh sách khu vực.** Tại `area.html`, `style.css`, dựng heading, Add area, form tìm kiếm, area cards và phân trang Areas. **Cần:** TODO-05–TODO-08. **Đạt khi:** card có code/name, kích thước, tọa độ, ghi chú, Edit/Delete; không gộp AP thành thiết bị chỉ riêng phòng đó sử dụng.

- [x] **TODO-21 — Hoàn thiện danh sách AP.** Tại `area.html`, `style.css`, dựng section AP riêng, bộ lọc, bảng đủ các cột và phân trang AP. **Cần:** TODO-20. **Đạt khi:** thể hiện slot 1–4, placement, Enabled và Moved; phân biệt cấu hình Enabled với quan sát mất sóng.

- [x] **TODO-22 — Hoàn thiện form thêm/sửa khu vực.** Tại `area.html`, thêm `#area-editor` theo EntityEditor và style cần thiết trong `style.css`. **Cần:** TODO-09, TODO-20. **Đạt khi:** đủ Code, Name, X, Y, Width, Height, Notes; chỉ một editor dùng cho hai trạng thái Add/Edit.

- [x] **TODO-23 — Hoàn thiện form thêm/sửa AP.** Tại `area.html`, thêm `#ap-editor` theo EntityEditor. **Cần:** TODO-09, TODO-21. **Đạt khi:** đủ các trường trong mục 6, slot 1–4 và trạng thái lỗi mẫu; chưa lưu hoặc kiểm tra cơ sở dữ liệu.

- [x] **TODO-24 — Hoàn thiện trạng thái và xác nhận xóa của Areas & APs.** Tại `area.html`, `style.css`, thêm DeleteDialog dùng chung cho hai loại bản ghi, PageFeedback và mẫu empty/no-results/dependency-warning. **Cần:** TODO-10, TODO-22, TODO-23. **Đạt khi:** dialog nêu rõ đối tượng, cảnh báo liên kết và Cancel/Delete; không xóa dữ liệu thật.

### F. Surveys — mục 7 của sơ đồ

- [x] **TODO-25 — Hoàn thiện danh sách khảo sát.** Tại `survey.html`, `style.css`, dựng page-header, Create survey, bộ lọc, bảng chín cột và phân trang. **Cần:** TODO-05–TODO-08. **Đạt khi:** các dòng khớp header; thể hiện riêng điều kiện, accuracy, hiệu chuẩn, kết thúc và current map.

- [x] **TODO-26 — Hoàn thiện editor và dialog vòng đời khảo sát.** Tại `survey.html`, thêm `#survey-editor`, `#survey-action` và DeleteDialog theo mục 7. **Cần:** TODO-09, TODO-25. **Đạt khi:** đủ form và trạng thái xác nhận đổi bản đồ/hiệu chuẩn/kết thúc; chưa thực hiện các hành động này.

- [x] **TODO-27 — Hoàn thiện form ngữ cảnh thu khảo sát.** Tại `survey.html`, `style.css`, dựng collection-setup với Tag, Survey, Actual room, Condition, lỗi mẫu và Start collection. **Cần:** TODO-07, TODO-25. **Đạt khi:** đủ ba thẻ, bốn phòng và bảy điều kiện theo sơ đồ; chưa gửi lệnh cho thiết bị.

- [x] **TODO-28 — Hoàn thiện lịch sử lượt thu và trạng thái Surveys.** Tại `survey.html`, `style.css`, thêm bảng Collection runs, Stop collection, phân trang, PageFeedback và trạng thái rỗng/đang thu/đã kết thúc. **Cần:** TODO-10, TODO-26, TODO-27. **Đạt khi:** trạng thái current map tách khỏi Open/Finished và các hành động không phù hợp có giải thích.

### G. Sessions — mục 8 của sơ đồ

- [x] **TODO-29 — Hoàn thiện tiêu đề và bộ lọc phiên.** Tại `sessions.html`, `style.css`, dựng heading, Add sample session, Export filtered CSV và toàn bộ trường trong session-filters. **Cần:** TODO-05–TODO-07. **Đạt khi:** đủ sáu nhãn, nguồn nhãn, nguồn dữ liệu, inclusion và mismatch; chưa chạy lọc/xuất dữ liệu.

- [x] **TODO-30 — Hoàn thiện bảng phiên và phân trang.** Tại `sessions.html`, `style.css`, dựng bảng 15 cột, dòng mẫu, số kết quả, link chi tiết và Edit/Delete. **Cần:** TODO-08, TODO-29. **Đạt khi:** bốn RSSI tách cột, nhãn máy/hiện hành và hai loại nguồn phân biệt rõ; bảng cuộn trong vùng riêng.

- [ ] **TODO-31 — Hoàn thiện editor phiên mẫu.** Tại `sessions.html`, thêm `#session-editor` theo mục 8. **Cần:** TODO-09, TODO-30. **Đạt khi:** đủ trường đọc RSSI, ô thật, đợt/map, điều kiện và lý do; có chú thích −100 và SYNTHETIC; chưa thêm/sửa dữ liệu.

- [ ] **TODO-32 — Hoàn thiện trạng thái và dialog xóa phiên.** Tại `sessions.html`, `style.css`, thêm DeleteDialog, PageFeedback, empty/no-results/error và trạng thái không có dữ liệu xuất. **Cần:** TODO-10, TODO-31. **Đạt khi:** mẫu xóa nêu liên kết nhãn/cảnh báo; bộ lọc và số kết quả mẫu không mâu thuẫn.

### H. Session details — mục 9 của sơ đồ

- [ ] **TODO-33 — Hoàn thiện breadcrumb và thông tin phiên.** Tại `session-detail.html`, `style.css`, dựng breadcrumb, tiêu đề, Back to sessions, metadata và mismatch note. **Cần:** TODO-05, TODO-06. **Đạt khi:** đủ các cặp thông tin trong mục 9; không lẫn thời điểm đo với nhận hoặc nhãn máy với nhãn duyệt.

- [ ] **TODO-34 — Hoàn thiện khung so sánh tín hiệu.** Tại `session-detail.html`, `style.css`, thêm chọn phòng, legend và ChartFigure cho bốn RSSI so với fingerprint. **Cần:** TODO-08, TODO-33. **Đạt khi:** có canvas, bảng thay thế, đơn vị dBm và mẫu Missing/no-fingerprint; chưa viết hàm vẽ hoặc tính fingerprint.

- [ ] **TODO-35 — Hoàn thiện form duyệt nhãn.** Tại `session-detail.html`, `style.css`, dựng reviewer-panel, sáu lựa chọn nhãn, lý do và Save reviewed label. **Cần:** TODO-07, TODO-33. **Đạt khi:** form có label/lỗi mẫu và trạng thái chỉ đọc; nội dung nói rõ giữ lịch sử máy; chưa lưu nhãn.

- [ ] **TODO-36 — Hoàn thiện khu vực loại/khôi phục phiên.** Tại `session-detail.html`, `style.css`, dựng inclusion-panel, lý do và hai trạng thái Included/Excluded. **Cần:** TODO-35. **Đạt khi:** mỗi trạng thái có đúng nút Exclude hoặc Restore; không thay đổi dữ liệu.

- [ ] **TODO-37 — Hoàn thiện lịch sử nhãn và cảnh báo liên quan.** Tại `session-detail.html`, `style.css`, dựng hai bảng, phân trang độc lập, PageFeedback và mẫu session-not-found/empty. **Cần:** TODO-08, TODO-10, TODO-34–TODO-36. **Đạt khi:** đủ cột theo mục 9 và có đường quay lại danh sách khi không tìm thấy phiên.

### I. Analytics — mục 10 của sơ đồ

- [ ] **TODO-38 — Hoàn thiện bộ chọn phạm vi và KPI thống kê.** Tại `analytics.html`, `style.css`, dựng heading, Export, source/map selectors, ghi chú dữ liệu và bốn chỉ số accuracy-summary. **Cần:** TODO-05–TODO-07. **Đạt khi:** phân biệt DEVICE/SYNTHETIC/UCI, số phiên hợp lệ và số bị loại; chưa tính thống kê.

- [ ] **TODO-39 — Hoàn thiện so sánh bốn điều kiện.** Tại `analytics.html`, `style.css`, dựng bảng và ChartFigure cho IMMEDIATE, AFTER_3H, AP_MOVED, CROWDED. **Cần:** TODO-08, TODO-38. **Đạt khi:** có cột chênh lệch theo điểm phần trăm, trạng thái Not measured và không áp dụng cho UCI; chưa viết hàm tính/vẽ.

- [ ] **TODO-40 — Hoàn thiện bảng confusion matrix.** Tại `analytics.html`, `style.css`, dựng bảng bốn hàng phòng thật, bốn cột phòng dự đoán, BORDER, tổng và accuracy từng phòng. **Cần:** TODO-08, TODO-38. **Đạt khi:** header hàng/cột rõ ràng, AP_LOST được giải thích riêng và số liệu chỉ là mẫu.

- [ ] **TODO-41 — Hoàn thiện phần fingerprint.** Tại `analytics.html`, `style.css`, dựng bảng số mẫu/mean ± SD, ChartFigure và cảnh báo ít mẫu. **Cần:** TODO-08, TODO-38. **Đạt khi:** đủ bốn AP, đơn vị dBm và trạng thái cần chọn một map khi scope là All maps; chưa tính mean/SD.

- [ ] **TODO-42 — Hoàn thiện phân bố nhãn và chất lượng truyền.** Tại `analytics.html`, `style.css`, dựng label-distribution và review-transport theo mục 10. **Cần:** TODO-38, TODO-41. **Đạt khi:** có đủ sáu nhãn, số/tỷ lệ BORDER/AP_LOST; phần độ trễ chỉ được trình bày trong mẫu DEVICE.

- [ ] **TODO-43 — Hoàn thiện đối chiếu UCI và tiến độ thực nghiệm.** Tại `analytics.html`, `style.css`, dựng hai bảng baseline-comparison/experiment-progress và các chú thích. **Cần:** TODO-08, TODO-38. **Đạt khi:** đủ bảy điều kiện với tổng mục tiêu 1.130, có trạng thái chưa có dữ liệu nhóm; không giả lập thành kết quả thật.

- [ ] **TODO-44 — Hoàn thiện trạng thái toàn trang Analytics.** Tại `analytics.html`, `style.css`, thêm PageFeedback và kiểm tra cách trình bày no-data/no-map/insufficient-samples. **Cần:** TODO-10, TODO-39–TODO-43. **Đạt khi:** không hiển thị 0% thay cho dữ liệu chưa đo và không gộp fingerprint của nhiều bản đồ.

### J. Kiểm tra giao diện sau từng phần

- [ ] **TODO-45 — Kiểm tra responsive trang Login.** Tại `login.html`, `style.css`, điều chỉnh riêng bố cục login ở desktop/tablet/mobile. **Cần:** TODO-11–TODO-13. **Đạt khi:** form và tài khoản mẫu không bị cắt, thứ tự đọc đúng, không tràn ngang toàn trang.

- [ ] **TODO-46 — Kiểm tra responsive Dashboard và navigation.** Tại `index.html`, các header workspace và `style.css`, điều chỉnh KPI, map/tag panel và cách trình bày menu trên màn hình hẹp. **Cần:** TODO-05, TODO-14–TODO-19. **Đạt khi:** có một menu dùng chung, KPI chuyển 4/2/1 cột phù hợp, không thay đổi sơ đồ DOM đã chốt.

- [ ] **TODO-47 — Kiểm tra responsive Areas & APs và Surveys.** Tại `area.html`, `survey.html`, `style.css`, rà card, filter, bảng và dialog. **Cần:** TODO-20–TODO-28. **Đạt khi:** form/dialog vừa màn hình, bảng có vùng cuộn riêng; kiểm tra cả nội dung dài và trạng thái rỗng.

- [ ] **TODO-48 — Kiểm tra responsive Sessions và Session details.** Tại `sessions.html`, `session-detail.html`, `style.css`, rà bộ lọc nhiều trường, bảng rộng, biểu đồ, review form và dialog. **Cần:** TODO-29–TODO-37. **Đạt khi:** tất cả nhãn/nút đọc được và không bị che ở màn hình hẹp.

- [ ] **TODO-49 — Kiểm tra responsive Analytics.** Tại `analytics.html`, `style.css`, rà KPI, bảng confusion matrix, fingerprint và vùng biểu đồ. **Cần:** TODO-38–TODO-44. **Đạt khi:** giữ đủ số liệu/cột, không co chữ đến khó đọc và không tràn ngang toàn trang.

- [ ] **TODO-50 — Kiểm tra ngữ nghĩa và khả năng truy cập.** Trong bảy file HTML và `style.css`, rà một main/h1 mỗi trang, heading, label/for, ID, caption, row/column headers, skip-link, focus và tên truy cập của nút. **Cần:** các TODO trang tương ứng đã được duyệt. **Đạt khi:** sửa các lỗi phát hiện trong phạm vi giao diện, không đổi cấu trúc thiết kế hoặc thêm nghiệp vụ.

- [ ] **TODO-51 — Kiểm tra cách trình bày theo vai trò.** Trong các trang có hành động, đối chiếu bảng vai trò mục 11 bằng các trạng thái mẫu; bổ sung chú thích disabled/read-only khi cần. **Cần:** TODO-24, TODO-28, TODO-32, TODO-37. **Đạt khi:** không trình bày quyền sửa/xóa sai vai trò; không xây hệ thống đăng nhập/phân quyền thật.

- [ ] **TODO-52 — Kiểm tra nội dung và liên kết toàn bộ demo.** Trong bảy file HTML, rà chữ tiếng Anh, tên trang, liên kết file, active menu, nhãn Demo data, đơn vị, số cột và đường dẫn tài nguyên. **Cần:** TODO-45–TODO-51. **Đạt khi:** không còn link sai, ID trùng, nhãn tiếng Việt trên UI hoặc thư viện ngoài; ghi nhận riêng các nút/biểu đồ chưa có hành vi vì nằm ngoài phạm vi demo tĩnh.

- [ ] **TODO-53 — Đối chiếu giao diện với sơ đồ và ghi nhận nghiệm thu.** Chỉ cập nhật trạng thái TODO trong `README.md` dựa trên các phần đã được người dùng duyệt; liệt kê chỗ còn thiếu để người dùng quyết định bước tiếp theo. **Cần:** TODO-52. **Đạt khi:** không tự đánh dấu phần chưa được duyệt là xong, không sửa sơ đồ DOM và không tự bắt đầu tích hợp NetBeans/backend.

### K. TODO riêng — Header khi cuộn

- [ ] **TODO-54 — Giữ header hiển thị khi cuộn trang**

**Trạng thái:** Chưa thực hiện. Chỉ có kết quả đọc mã và kế hoạch; chưa thay CSS/HTML/JavaScript, chưa kiểm chứng hành vi bằng trình duyệt.

**Phạm vi:** Bản giao diện WifiRoom tại `D:\Nguyen\PRJ301\Project\WifiRoom_ProjectLayout`, cùng dự án áp dụng TODO-01–TODO-53. Không tự áp dụng sang bản JSP/NetBeans trong thư mục `WifiRoom`. Giữ nguyên sơ đồ DOM, giao diện, menu, liên kết và các tương tác hiện có. Không phụ thuộc việc hoàn tất mọi TODO trước; dựa trên header hiện đã có.

**Kết quả kiểm tra mã hiện tại (12/10/2026):**

- Sáu trang workspace dùng `header.top-navbar`. Trong `index.html`, header nằm trong `#main-app.app-layout`, cùng phần nội dung kéo dài của trang; năm trang còn lại đặt header trực tiếp dưới `body.workspace-page`.
- `style.css`, khối `.top-navbar` khoảng dòng 1938, đặt `position: relative`, chưa có `top` và `z-index` cho header. Vì vẫn là khối cuộn thông thường, header ra khỏi viewport khi cuộn xuống. Đây là nguyên nhân xác định từ mã, không phải lỗi nút Menu.
- `.workspace-page .app-layout` đang dùng `display: block`; `.app-layout` có `min-height: 100vh`. Các quy tắc đã kiểm tra cho body/wrapper này không tạo vùng cuộn riêng hay giới hạn chiều cao cố định. Không sửa `.sidebar { position: sticky }` hoặc `.topbar` cũ vì chúng không phải header đang dùng ở các trang HTML này.
- Header có sẵn nền trắng `#fff`, border và shadow. Chiều cao tối thiểu là 88px nhưng có thể tăng vì flex-wrap; không được xem 88px là chiều cao cố định.
- Breakpoint mobile hiện tại là 650px. `main.js` khoảng dòng 95 điều khiển `.menu-toggle` và `#primary-navigation` bằng `hidden`, `aria-expanded`, Escape và thay đổi breakpoint. Mở menu làm thay đổi chiều cao header.
- `.toast-region` đang fixed với z-index 1000; dialog modal dùng cơ chế top layer. Cần giữ thứ tự lớp để header không che thông báo hoặc dialog.

**Lựa chọn bố cục:** Dùng `position: sticky` và `top: 0` cho `.workspace-page .top-navbar`. Sticky giữ chỗ của header trong luồng trang, phù hợp với chiều cao tự thay đổi và tránh phải bù một khoảng cố định cho main như khi dùng fixed. Chỉ cân nhắc fixed nếu kiểm tra thực tế phát hiện ràng buộc không thể khắc phục trong phạm vi này; khi đó phải báo lại lý do trước khi đổi phương án.

**Tệp liên quan:**

| Tệp tại thư mục ProjectLayout | Công việc dự kiến |
|---|---|
| `style.css` | Tệp chỉnh chính: vị trí sticky, top, lớp hiển thị, nền, giới hạn chiều cao và xử lý vùng nhìn trên mobile. |
| `main.js` | Giữ logic Menu hiện có; chỉ bổ sung đo chiều cao header nếu cần offset chính xác cho anchor/focus khi header thay đổi kích thước. Không viết lại menu hoặc thêm thư viện. |
| `index.html` | Kiểm tra wrapper `#main-app.app-layout`, header và `#main-content`; không thay DOM nếu không có lỗi thực tế. |
| `area.html`, `survey.html`, `sessions.html`, `session-detail.html`, `analytics.html` | Kiểm tra cùng quy tắc header, nội dung đầu trang, menu, anchor và dialog trên từng trang. |
| `login.html` | Kiểm tra hồi quy: không có AppHeader và không bị áp dụng style sticky mới. |
| `README.md` | Ghi kết quả kiểm tra và trạng thái TODO này sau khi người dùng duyệt. |

**Các bước thực hiện khi được giao TODO-54:**

1. Kiểm tra lại computed styles của header, body và wrapper trong trình duyệt để xác nhận scroll container thực tế. Rà các ancestor có overflow/transform/contain và giới hạn chiều cao nếu có thay đổi mã sau lần đọc này; không xóa các quy tắc overflow không liên quan, đặc biệt vùng cuộn bảng.
2. Chỉnh quy tắc header hiện có trong `style.css` sang sticky, đặt top bằng 0, dùng selector giới hạn trong `.workspace-page`. Đặt z-index 100 làm mức dự kiến: cao hơn nội dung thường, thấp hơn toast 1000; kiểm tra stacking context thực tế. Giữ nền trắng đặc, border, shadow, màu, padding và menu hiện có; không nhân bản header.
3. Giữ header trong luồng tài liệu: không thêm spacer hoặc padding-top cố định 88px cho main. Kiểm tra lúc mở/đóng Menu, flex-wrap, đổi chiều màn hình và zoom để nội dung đầu trang luôn nằm sau chiều cao thực của header, không bị nhảy khoảng trắng.
4. Xử lý anchor/skip-link và focus bàn phím: đặt khoảng cuộn tránh header che đích đến. Nếu cần, dùng ResizeObserver trong `main.js` để đưa chiều cao thực của header vào một CSS custom property và áp dụng scroll-padding-top trên scroll container đúng; khởi tạo có điều kiện khi tồn tại `.top-navbar`. Tính lại khi menu mở/đóng hoặc chữ xuống dòng; không cộng trùng offset vào cả layout và scroll. Kiểm tra thực tế việc focus cuộn vào vùng nhìn, không chỉ việc click anchor.
5. Giữ nguyên breakpoint 650px và logic menu `hidden`/`aria-expanded`/Escape. Với viewport thấp hoặc menu mở dài hơn màn hình, giới hạn chiều cao vùng header/menu bằng chiều cao viewport khả dụng (ưu tiên dvh, có fallback vh) và cho vùng cần thiết cuộn dọc. Bảo đảm Menu, liên kết cuối, thông tin người dùng và Log out vẫn tới được bằng chạm lẫn bàn phím; không ép chiều cao cố định hoặc cắt nội dung bằng overflow hidden.
6. Kiểm tra sáu trang workspace ở desktop 1440px và 1024px, tablet 768px, mobile 390px và 320px; kiểm tra thêm ngay hai phía breakpoint 650px, màn hình ngang thấp và zoom 200%. Với trang dài, cuộn đầu/giữa/cuối rồi cuộn trở lại đầu; trang ngắn không được xuất hiện khoảng trống bù giả.
7. Trên mobile, thử mở Menu trước khi cuộn, mở Menu sau khi đã cuộn, cuộn khi menu mở, chọn liên kết, đóng bằng nút và Escape, rồi đổi độ rộng qua breakpoint. Kiểm tra Tab/Shift+Tab, skip-link, focus trở về nút Menu và không mất khả năng cuộn trang.
8. Kiểm tra lớp hiển thị: nội dung đi phía dưới nền header, bảng vẫn cuộn ngang độc lập, toast vẫn nhìn thấy, dialog/modal và backdrop nằm đúng lớp trên header. Đối chiếu giao diện trước/sau để giữ nguyên menu, active link, màu, kích thước và chức năng hiện có. Kiểm tra login không bị ảnh hưởng.
9. Báo cáo các tệp thực sự đã sửa và kết quả desktop/mobile, kèm ảnh ở đầu trang và sau khi cuộn, menu mobile đóng/mở. Nêu rõ trường hợp chưa kiểm chứng; dừng để người dùng kiểm tra. Chỉ đánh dấu TODO-54 hoàn thành sau khi được xác nhận, không tự làm TODO khác.

**Tiêu chí nghiệm thu:** Header giữ ở mép trên viewport xuyên suốt khi cuộn trên cả sáu trang; nền và thứ tự lớp đúng; nội dung đầu trang, đích anchor và phần tử nhận focus không bị che; menu mobile mở/đóng/cuộn được kể cả màn hình thấp; không tràn ngang hoặc có khoảng bù sai; giao diện, liên kết, dialog và chức năng hiện có được giữ nguyên. Các kiểm tra chưa chạy không được ghi là đạt.


## 14. Mốc triển khai và kiểm tra — 12/10/2026

Ghi nhận này phân biệt **đã có mã giao diện** với **đã nghiệm thu**. Giữ nguyên checkbox do người dùng xác nhận; không tự đánh dấu các mục từ TODO-31 trở đi.

| Nhóm | Kết quả hiện tại | Việc còn lại |
| --- | --- | --- |
| TODO-19–30 | Nội dung Dashboard, Areas & APs, Surveys và danh sách Sessions đã triển khai; checkbox hiện được đánh dấu trong danh sách trên. | Kiểm tra trực quan trong nhóm responsive. |
| TODO-31–32 | Editor phiên mẫu có đủ RSSI 1–4, giới hạn −100…−1 dBm, phòng thật, survey/map, điều kiện, lý do; có dialog xóa, PageFeedback và trạng thái danh sách. | Người dùng nghiệm thu giao diện. |
| TODO-33–37 | Session details có metadata, so sánh tín hiệu/bảng thay thế, review, inclusion/restore, lịch sử và cảnh báo. | Kiểm tra trực quan các trạng thái ẩn và nghiệm thu. |
| TODO-38–44 | Analytics có đủ KPI, bốn điều kiện, confusion matrix, fingerprint, phân bố sáu nhãn, mẫu DEVICE, UCI baseline và tiến độ 1.130 phiên. | Kiểm tra trực quan các trạng thái no-data, UCI, All maps và nghiệm thu. |
| TODO-45–49 | Đã rà CSS và bổ sung khung responsive: login, KPI 4/2/1 cột, thẻ 3/2/1 cột, menu mobile dùng chung, form/card chuyển cột, bảng cuộn riêng, dialog giới hạn theo viewport. | **Chưa xác nhận bằng render trình duyệt** ở desktop/tablet/mobile; không coi các TODO này là hoàn thành. |
| TODO-50–52 | Kiểm tra mã đạt: cấu trúc HTML, ID/ARIA, label, caption, header bảng, link/tài nguyên cục bộ, active menu, tên nút và số liệu mẫu. Có mẫu quyền chỉ đọc và chú thích vai trò. | Kiểm tra focus/độ tương phản/overflow thực tế, các trạng thái mẫu và nghiệm thu. |
| TODO-53 | Đã ghi nhận tiến độ và các giới hạn kiểm chứng tại mục này. | Chỉ chốt nghiệm thu sau khi hoàn tất các kiểm tra còn lại và được người dùng xác nhận. |

### Kiểm tra đã thực hiện

- Bảy trang đều có một `main`, một `h1`, không trùng ID; các tham chiếu ARIA và label đều trỏ đến phần tử có thật.
- Tất cả bảng có caption, header hàng/cột và số ô khớp header. Sessions có 15 cột, Survey history có 9 cột, AP có đủ slot 1–4.
- Liên kết file/fragment và đích dialog đều tồn tại; mỗi trang nạp `main.js` một lần, không dùng tài nguyên ngoài.
- Analytics: 20 phiên hợp lệ, 18 đúng; confusion matrix khớp tổng và tỷ lệ; phân bố nhãn có 120 phiên mẫu. Tổng mục tiêu DEVICE là 1.130, số thu thực tế mẫu là 0; không lấy SYNTHETIC/UCI làm kết quả thiết bị của nhóm.
- `node --check main.js` đạt. Kiểm thử logic bằng DOM mô phỏng đã kiểm tra chặn submit, Show/Hide password, menu mobile/Escape, reset/điền editor, ngữ cảnh xóa, trả focus khi đóng dialog và ẩn toast. Đây không thay thế kiểm tra trình duyệt thật.
- Công cụ computer-use đã thử kiểm tra Chrome nhưng tự dừng vì không xác định chắc chắn URL hiện tại để thực thi chính sách. Chưa có ảnh/render dùng để chứng nhận responsive.

### Cách kiểm tra tiếp

1. Mở từng trang ở các độ rộng 1440, 768, 390 và 320 CSS px; kiểm tra thêm zoom 200%, nội dung dài, form lỗi và dialog đang mở. Bảng chỉ được cuộn trong `.table-scroll`, không làm tràn toàn trang.
2. Trên mobile, kiểm tra Menu, `aria-expanded`, thứ tự Tab và Escape. Kiểm tra skip-link; mở editor bằng Add/Edit, đóng bằng Close/Cancel/Escape và kiểm tra focus quay lại nút mở.
3. Các trạng thái mẫu dùng `hidden` và comment ngay cạnh markup. Khi bật mẫu empty/error/no-map/no-data, ẩn khối dữ liệu/phân trang tương ứng; chỉ hiển thị một trạng thái mỗi lần. Với lỗi trường, đồng thời đặt `aria-invalid="true"` và `aria-describedby` trỏ đến thông báo lỗi đang hiện.
4. Với mẫu REVIEWER/VIEWER hoặc vai trò khác, dùng hướng dẫn comment tại trang và bảng quyền mục 11 để ẩn/vô hiệu hóa hành động không được phép. Mặc định các trang minh họa ADMIN; chưa có cơ chế xác thực/phân quyền.
5. Analytics đang hiển thị bộ dữ liệu SYNTHETIC / SURVEY_01 cố định. Mẫu UCI phải thay phần so sánh điều kiện bằng Not applicable; mẫu All maps phải thay fingerprint bằng yêu cầu chọn một map; mẫu không có phiên hợp lệ dùng Not evaluated. Không cộng hoặc gộp fingerprint giữa các map.

### Giới hạn của demo tĩnh

- Có tương tác giao diện cục bộ: menu, Show/Hide password, mở/đóng dialog, điền bản ghi mẫu để xem editor và mở/đóng bảng dữ liệu bằng `details`.
- Chưa thực hiện đăng nhập, CRUD, lọc dữ liệu, xuất CSV, polling, thu thiết bị, tính thống kê, luật cảnh báo hoặc vẽ canvas. Nút Save/Apply/Start không gửi form và không ghi dữ liệu; các nút chưa có hành vi được ghi chú hoặc vô hiệu hóa.
- Đổi ngày/phạm vi/phòng so sánh chưa cập nhật bộ số liệu; chú thích tại các control chỉ rõ dữ liệu đang là ví dụ cố định. Các sơ đồ/biểu đồ cung cấp số liệu thay thế bằng chữ hoặc bảng.
- Không sửa dự án NetBeans `WifiRoom` và chưa bắt đầu tích hợp backend.


TODO: Xây dựng Interactive Login Intro cho WifiRoom

**Cập nhật triển khai — 13/10/2026:** Đã thêm mã trong `login.html`, `login-intro.js` và khối CSS `Interactive login` cuối `style.css`. Giữ checkbox để chờ kiểm tra giao diện và nghiệm thu.

- Intro gồm WiFi trung tâm và bốn phòng vào vị trí trong 2,3–2,66 giây, nhãn luôn thẳng. Chuyển cảnh 1,3 giây, giữ vị trí chuyển động hiện tại rồi tản các phòng thành nền.
- Có ba trạng thái `intro` / `transitioning` / `login`; mở bằng Log in (giữ tiếng Anh trên UI), skip-link, cuộn hoặc vuốt lên. Gỡ listener cử chỉ sau lần mở đầu tiên; form dùng được ngay trong chuyển cảnh.
- Ghi nhớ bằng `sessionStorage`; bỏ qua intro khi có lỗi hiển thị, đích `#login-form` hoặc giảm chuyển động. Storage bị chặn vẫn dùng được; không chạy JavaScript thì form hiển thị mặc định. Focus vào tiêu đề để tránh bật bàn phím mobile.
- Rà mã bố cục cũ: tổng chiều cao gồm padding, form, tài khoản demo và footer; mobile còn xếp story phía trên form. Nội dung vượt viewport cần cuộn tự nhiên. Bố cục mới dùng `min-height: 100svh`, fallback `100vh`, không khóa cuộn hoặc ép chiều cao form; nền không bắt chuột.
- Giữ form, ID trường, hiện mật khẩu, lỗi mẫu, tài khoản demo và liên kết `index.html`. Đây vẫn là demo tĩnh: `main.js` chặn submit, nút đăng nhập là liên kết; chưa có xác thực thành công/thất bại thật.
- Đã kiểm tra cú pháp JavaScript, ID HTML và đường dẫn script. Kiểm tra logic trạng thái đạt: bấm lặp, hoàn tất chuyển cảnh, gỡ listener, bỏ qua theo phiên, reduced motion, lỗi, hash, storage bị chặn, ngưỡng wheel, vuốt và đổi reduced motion giữa chuyển cảnh.
- Chưa nghiệm thu trực quan vì phiên làm việc không có trình duyệt kết nối. Cần kiểm tra desktop/mobile, màn hình thấp, zoom, bàn phím ảo, tương tác thực tế và độ mượt theo Bước 12; chưa ghi nhận các kiểm tra này là đạt.

Mục tiêu: Khi mở trang, hiển thị mô hình WiFi và 4 phòng. Khi cuộn xuống hoặc bấm “Đăng nhập”, mô hình chuyển thành nền và form xuất hiện chậm, mượt.

Bước 1 — Kiểm tra trang login hiện tại
- [ ] Xác định các tệp giao diện, CSS và JavaScript đang dùng.
- [ ] Xác định form, xử lý đăng nhập, thông báo lỗi và liên kết hiện có để giữ nguyên chức năng.
- [ ] Kiểm tra nguyên nhân tràn chiều cao trước khi thêm hiệu ứng.

Bước 2 — Chia giao diện thành các lớp
- [ ] Tạo lớp intro gồm tên WifiRoom, mô hình phòng và biểu tượng WiFi.
- [ ] Tạo lớp nền đồ họa có thể chuyển động độc lập.
- [ ] Đặt form đăng nhập trong lớp riêng, phía trên nền.
- [ ] Quản lý ba trạng thái: `intro`, `transitioning`, `login`; mỗi trạng thái có kiểu hiển thị rõ ràng.

Bước 3 — Dựng bố cục intro tĩnh
- [ ] Dùng chiều cao tối thiểu theo màn hình, ưu tiên `100svh` và có giá trị dự phòng `100vh`.
- [ ] Đặt biểu tượng WiFi ở trung tâm, bố trí Room 01–04 cân đối xung quanh.
- [ ] Dùng kích thước linh hoạt để mô hình vừa desktop và mobile.
- [ ] Thêm nút “Đăng nhập” cùng gợi ý “Cuộn xuống để tiếp tục”.
- [ ] Kiểm tra bố cục tĩnh không bị cắt hoặc tràn ngang trước khi thêm animation.

Bước 4 — Thêm chuyển động cho các phòng
- [ ] Cho mỗi phòng di chuyển theo một đoạn quỹ đạo hướng vào vị trí cuối, tránh xoay nhiều vòng.
- [ ] Tách phần chuyển động và phần nhãn để chữ trong phòng luôn thẳng.
- [ ] Đặt thời gian intro khoảng 2–3 giây, dùng `ease-out` để dừng nhẹ.
- [ ] Cho các phòng bắt đầu lệch nhau một chút nhưng hoàn tất trong tổng thời gian intro.
- [ ] Sau khi vào vị trí, giữ phòng ổn định.

Bước 5 — Thêm hiệu ứng WiFi
- [ ] Cho biểu tượng WiFi hiện dần ở trung tâm.
- [ ] Tạo các vòng sóng bằng CSS, dùng `transform` và `opacity` để lan nhẹ.
- [ ] Giảm hoặc dừng vòng sóng khi form đăng nhập xuất hiện.

Bước 6 — Xử lý thao tác mở form
- [ ] Tạo một hàm chuyển sang trạng thái đăng nhập, dùng chung cho các thao tác.
- [ ] Kích hoạt khi cuộn xuống có chủ ý, vuốt lên trên điện thoại hoặc bấm nút “Đăng nhập”.
- [ ] Cho phép nút hoạt động bằng bàn phím và ngay cả khi intro chưa chạy xong.
- [ ] Chặn kích hoạt lặp trong lúc chuyển cảnh.
- [ ] Chỉ chuyển cảnh một lần; không tự quay về intro khi cuộn lên.
- [ ] Sau khi mở form, ngừng bắt thao tác cuộn dành cho intro để trang cuộn bình thường.

Bước 7 — Tạo chuyển cảnh nền
- [ ] Từ vị trí hiện tại, cho các phòng tản nhẹ sang hai bên, thu nhỏ và giảm độ rõ.
- [ ] Ưu tiên thay đổi `transform` và `opacity` để chuyển động mượt.
- [ ] Giữ vùng phía sau ô nhập đơn giản, bảo đảm chữ dễ đọc.
- [ ] Đặt thời gian chuyển cảnh khoảng 1–1,4 giây.
- [ ] Cho lớp đồ họa nền bỏ qua thao tác chuột để không che nút hoặc ô nhập.

Bước 8 — Hiển thị form đăng nhập
- [ ] Cho form hiện dần, kết hợp trượt lên khoảng 12–16px trong lúc nền tản ra.
- [ ] Đặt chiều rộng tối đa phù hợp và khoảng đệm hai bên trên màn hình nhỏ.
- [ ] Trước khi mở, bảo đảm form ẩn không nhận Tab hoặc focus.
- [ ] Khi mở xong, chuyển focus hợp lý vào form; trên mobile tránh tự bật bàn phím ngoài ý muốn.
- [ ] Giữ nguyên xử lý đăng nhập, kiểm tra dữ liệu và hiển thị lỗi.
- [ ] Không trì hoãn thao tác nhập hoặc gửi form để chờ hiệu ứng trang trí.

Bước 9 — Xử lý màn hình thấp và bàn phím mobile
- [ ] Căn giữa form khi đủ không gian; cho phép cuộn dọc khi nội dung cao hơn màn hình.
- [ ] Tránh đặt chiều cao cố định hoặc khóa cuộn khiến phần đầu/cuối form bị cắt.
- [ ] Khi bàn phím mở, bảo đảm ô đang nhập và nút đăng nhập vẫn có thể cuộn tới.
- [ ] Thu nhỏ hoặc ẩn bớt đồ họa trang trí trên màn hình nhỏ.
- [ ] Kiểm tra khi thông báo lỗi làm chiều cao form tăng lên.

Bước 10 — Thêm khả năng bỏ qua intro
- [ ] Lưu trạng thái đã xem bằng `sessionStorage` để lần quay lại trong cùng phiên có thể mở form ngay.
- [ ] Giữ nút “Đăng nhập” làm cách bỏ qua intro ở lần truy cập đầu.
- [ ] Nếu đăng nhập thất bại và trang tải lại, hiển thị form cùng thông báo lỗi ngay, không chạy lại intro.

Bước 11 — Hỗ trợ giảm chuyển động và dự phòng
- [ ] Với `prefers-reduced-motion`, bỏ chuyển động quỹ đạo và mở form trực tiếp hoặc chuyển rất nhẹ.
- [ ] Thiết kế mặc định để form vẫn truy cập được nếu JavaScript không chạy.
- [ ] Chỉ bật trạng thái intro ẩn form sau khi JavaScript đã khởi tạo thành công.
- [ ] Bảo đảm biểu tượng trang trí không gây nhiễu cho trình đọc màn hình.

Bước 12 — Kiểm tra toàn bộ trải nghiệm
- [ ] Mở trang lần đầu: intro cân đối, chuyển động chậm và chữ dễ đọc.
- [ ] Bấm bỏ qua khi intro đang chạy: chuyển cảnh không giật hoặc nhảy vị trí.
- [ ] Cuộn nhanh hoặc bấm nhiều lần: form chỉ mở một lần.
- [ ] Dùng chuột, cảm ứng và bàn phím để mở form và đăng nhập.
- [ ] Kiểm tra màn hình thấp, mobile, phóng to trang và chế độ giảm chuyển động.
- [ ] Kiểm tra đăng nhập thành công, thất bại và quay lại trang trong cùng phiên.

Tiêu chí hoàn thành: Intro thể hiện rõ mô hình WifiRoom, chuyển sang form chậm và mượt khi tương tác; form dễ truy cập, không bị cắt nội dung và giữ nguyên chức năng đăng nhập.


TODO: Thêm chuyển cảnh nhẹ từ Login sang Dashboard

**Cập nhật triển khai — 13/10/2026:** Đã triển khai trong `login-transition.js`, `dashboard-entry.js`, `login.html`, `index.html` và `style.css`. Chưa đánh dấu checkbox nghiệm thu vì chưa kiểm tra trực quan trong trình duyệt.

- Khi JavaScript hoạt động, liên kết đăng nhập được nâng cấp thành nút submit, hỗ trợ Enter và kiểm tra required. Nút Logging in… có spinner, cùng chiều cao 48px; chặn gửi lặp. Không có JavaScript thì giữ liên kết Dashboard ban đầu.
- Hiện chưa có backend: chỉ kiểm tra các username demo hiển thị trên trang với mật khẩu mẫu `123456`. Đây không phải xác thực bảo mật, không tạo phiên đăng nhập hoặc thay đổi phân quyền. Khi tích hợp backend, thay phần demo adapter bằng kết quả xác thực thật trước khi chạy hiệu ứng.
- Sai thông tin khôi phục nút và báo lỗi, không chuyển cảnh. Trên HTTP(S), kiểm tra khả năng tải Dashboard trước khi rời trang; lỗi mạng/HTTP hoặc timeout trả về form để thử lại. Bản mở bằng `file:` bỏ qua fetch vì giới hạn trình duyệt.
- Login fade-out và trượt lên 8px trong 0,5 giây, nền giảm độ rõ. Điều hướng theo animationend, có fallback 650ms và khóa điều hướng lặp. Nếu trang cũ vẫn còn sau 5 giây, khôi phục form để thử lại; khi dùng Back từ bộ nhớ trình duyệt cũng khôi phục trạng thái.
- Dashboard đọc/xóa dấu thời gian sessionStorage ngay trong head, chỉ nhận dấu mới trong 15 giây. Nền ban đầu đồng màu Login; khung fade-in 0,8 giây, nội dung trượt 10px. Các thẻ trong viewport chạy 1 giây, lệch 0,12 giây, tổng độ trễ tối đa 0,48 giây. Scroll Reveal hiện có vốn bỏ qua phần tử trong viewport lúc khởi tạo nên không chạy hai lần trên các thẻ này.
- Dashboard hiện là HTML tĩnh, không có vùng chờ dữ liệu; không thêm skeleton hay thời gian chờ giả. Không có overlay chặn thao tác. Khi có API thật, cần bổ sung skeleton theo trạng thái tải thực tế (Bước 6).
- Reduced motion bỏ chuyển động; storage bị chặn vẫn điều hướng bình thường. Dashboard hiển thị mặc định khi không có JavaScript/animation; hiệu ứng hữu hạn và có dọn class.
- Đã kiểm tra cú pháp và kiểm tra logic bằng Node: dữ liệu sai, required, gửi lặp, thành công, animation/fallback điều hướng một lần, HTTP lỗi, khôi phục khi điều hướng không hoàn tất, reduced motion, storage bị chặn, file preview, Back và dấu chuyển cảnh hết hạn/được dùng một lần đều đạt. Chưa kiểm chứng độ mượt, lóe nền, responsive và lỗi điều hướng thực tế trên trình duyệt; phiên hiện không có trình duyệt kết nối.

Mục tiêu: Sau khi đăng nhập thành công, form biến mất nhẹ nhàng và Dashboard hiện lên chậm, mượt, đồng bộ với phong cách intro.

Bước 1 — Thêm trạng thái đang đăng nhập
- [ ] Khi gửi form, đổi nội dung nút thành “Đang đăng nhập…” và thêm biểu tượng xoay nhẹ.
- [ ] Ngăn gửi form nhiều lần trong lúc chờ kết quả.
- [ ] Giữ form ổn định, không thay đổi kích thước nút khi đổi nội dung.
- [ ] Nếu đăng nhập thất bại, khôi phục nút và hiển thị lỗi ngay tại form; không chạy chuyển cảnh.

Bước 2 — Tạo hiệu ứng rời trang Login
- [ ] Chỉ bắt đầu hiệu ứng sau khi hệ thống xác nhận đăng nhập thành công.
- [ ] Cho form mờ dần và trượt lên khoảng 8px trong 0,4–0,6 giây.
- [ ] Cho đồ họa nền giảm độ rõ nhẹ, không chạy lại animation intro.
- [ ] Dùng `transform`, `opacity` và easing mềm để tránh chuyển động đột ngột.

Bước 3 — Phối hợp chuyển giữa hai trang
- [ ] Nếu Login và Dashboard tải riêng, lưu dấu chuyển cảnh tạm thời bằng `sessionStorage` trước khi điều hướng.
- [ ] Điều hướng sau hiệu ứng rời trang; có thời gian dự phòng để không bị kẹt nếu sự kiện kết thúc animation không chạy.
- [ ] Đặt màu nền ban đầu của Dashboard đồng bộ với nền chuyển cảnh ở Login.
- [ ] Đưa CSS chuyển cảnh cần thiết vào phần tải sớm để tránh nội dung hiện lên rồi mới bị ẩn.
- [ ] Nếu dự án dùng điều hướng trong cùng ứng dụng, quản lý trạng thái chuyển cảnh trực tiếp tại lớp bố cục chung.

Bước 4 — Cho Dashboard xuất hiện nhẹ nhàng
- [ ] Khi nhận dấu chuyển cảnh từ Login, cho khung Dashboard hiện dần trong 0,6–0,9 giây.
- [ ] Giữ header và sidebar đúng vị trí; chỉ thay đổi độ rõ, không cho bay hoặc trượt xa.
- [ ] Cho nội dung chính trượt lên nhẹ khoảng 8–12px kết hợp fade-in.
- [ ] Xóa dấu chuyển cảnh sau khi sử dụng để tải lại trang không lặp hiệu ứng đăng nhập.

Bước 5 — Thêm nhịp xuất hiện cho các thẻ
- [ ] Cho các thẻ đang nằm trong màn hình hiện lần lượt, cách nhau 0,1–0,15 giây.
- [ ] Dùng thời gian 0,8–1,2 giây cho mỗi thẻ với `ease-out`.
- [ ] Giới hạn tổng độ trễ để các thẻ phía sau không phải chờ quá lâu.
- [ ] Với section nằm dưới màn hình, giữ Scroll Reveal và chỉ chạy khi cuộn tới.
- [ ] Tránh áp dụng cả hiệu ứng vào trang và Scroll Reveal lên cùng phần tử khiến animation chạy hai lần.

Bước 6 — Xử lý lúc Dashboard tải dữ liệu
- [ ] Hiển thị skeleton tại các vùng đang chờ dữ liệu, với kích thước gần nội dung thật.
- [ ] Khi dữ liệu sẵn sàng, thay skeleton bằng nội dung với fade-in nhẹ.
- [ ] Không thêm thời gian chờ giả nếu dữ liệu đã tải xong.
- [ ] Không dùng lớp phủ chuyển cảnh chặn thao tác khi Dashboard đã sẵn sàng.

Bước 7 — Thêm hỗ trợ giảm chuyển động và dự phòng
- [ ] Với `prefers-reduced-motion`, bỏ chuyển động trượt và giảm mạnh hoặc bỏ thời gian chuyển cảnh.
- [ ] Bảo đảm Dashboard vẫn hiển thị nếu JavaScript hoặc animation không chạy.
- [ ] Nếu không thể tải Dashboard, cho phép thử lại và không để màn hình bị giữ ở trạng thái trong suốt.
- [ ] Giữ nguyên luồng xác thực, phiên đăng nhập và phân quyền hiện có.

Tiêu chí hoàn thành: Đăng nhập thành công chuyển sang Dashboard mềm mại, hạn chế lóe nền và nhảy bố cục; đăng nhập sai vẫn giữ form, các thao tác không phải chờ hiệu ứng trang trí.



TODO: Thêm Dark Mode cho toàn bộ giao diện WifiRoom

**Cập nhật triển khai — 13/10/2026:** Đã thêm `theme.css`, `theme.js`, chuyển màu thành phần trong `style.css` sang biến ngữ nghĩa và gắn bộ chọn trên cả 7 trang HTML. Chưa đánh dấu checkbox nghiệm thu trực quan.

- Bộ màu dùng chung bao phủ nền, thẻ, chữ, viền, màu nhấn, bóng, hover/selected/disabled/focus; có màu riêng cho success, warning, error, info và offline. Theme tối dùng nền xanh đen, thẻ sáng hơn, chữ trắng ngà và xanh lá sáng. Giữ nhãn chữ và ký hiệu trạng thái đang có trên bản đồ/badge.
- Header các trang workspace và thanh trên Login có Appearance → Light / Dark / System, giữ ngôn ngữ tiếng Anh hiện tại. Bộ chọn dùng chung component dropdown Data source, có label, dấu chọn và điều khiển bàn phím.
- `theme.js` chạy đồng bộ trong head, sau stylesheet và trước nội dung; đặt `data-theme` và `data-theme-preference` trên html. Lưu lựa chọn tại `localStorage['wifiroom.theme']`; mặc định System. Chỉ theo thay đổi hệ điều hành khi chọn System; storage bị chặn vẫn đổi được trong trang.
- Đồng bộ khi đổi từ tab khác và khi quay lại trang qua bộ nhớ Back/Forward. Login, Dashboard, đăng xuất và tải lại đều dùng cùng bootstrap; meta theme-color cũng cập nhật. Không ghi hoặc thay đổi thông tin xác thực.
- Intro có token riêng cho phòng, WiFi, sóng, chữ và glow; nền Login và nền chuyển cảnh Dashboard cùng dùng `--intro-bg`. Form dùng `--surface` để tách khỏi nền.
- Sơ đồ dùng token cho nền/lưới/phòng/chú giải; khung canvas nhận nền theo theme. Các canvas hiện chỉ là placeholder, chưa có hàm vẽ hay dữ liệu tải bất đồng bộ nên không thêm biểu đồ hoặc skeleton giả. Có sẵn `--chart-*`, `--skeleton-*` và sự kiện `wifiroom:themechange` để renderer đọc màu/vẽ lại khi được triển khai sau.
- Chuyển màu 0,4 giây khi đổi lựa chọn; không thêm opacity hoặc chạy lại Scroll Reveal. Không bật transition khi tải lần đầu; reduced motion tắt transition. Khi JavaScript không chạy, CSS mặc định theo thiết bị và ẩn bộ chọn không hoạt động.
- Đã kiểm tra: cú pháp JS; 7 trang có bộ chọn, ID duy nhất và tài nguyên hợp lệ; mọi biến CSS được tham chiếu đều có định nghĩa; 13 cặp màu chữ/nền chính ở mỗi theme đạt tương phản ít nhất 4,5:1. Kiểm tra logic đạt cho lưu/khôi phục, System, đổi OS, storage lỗi, đồng bộ tab, Back/Forward và reduced motion.
- Chưa kiểm tra trực quan trên trình duyệt kết nối: cần nghiệm thu bố cục header/mobile, dropdown, dialog, khả năng đọc toàn bộ nội dung và chuyển trang thực tế. Kiểm tra tương phản ở trên là kiểm tra bộ màu, không thay thế kiểm tra giao diện đã render.

Mục tiêu: Hỗ trợ Sáng / Tối / Theo thiết bị, đồng bộ từ Login đến Dashboard và ghi nhớ lựa chọn của người dùng.

Bước 1 — Tạo bộ màu dùng chung
- [ ] Khai báo biến CSS cho nền trang, nền thẻ, chữ chính, chữ phụ, đường viền, màu nhấn và bóng.
- [ ] Tạo hai bộ giá trị tương ứng với chế độ sáng và tối.
- [ ] Với chế độ tối, dùng nền xám đen pha xanh nhẹ, thẻ sáng hơn nền và chữ trắng ngà.
- [ ] Giữ xanh lá làm màu nhận diện; điều chỉnh độ sáng để nút và liên kết dễ nhìn.
- [ ] Tạo màu riêng cho trạng thái thành công, cảnh báo, lỗi và offline.

Bước 2 — Áp dụng màu cho các thành phần
- [ ] Thay các màu cố định trong giao diện bằng biến CSS dùng chung.
- [ ] Áp dụng cho header, sidebar, section, thẻ thông tin và footer.
- [ ] Đồng bộ form, ô nhập, nút, dropdown, bảng, thông báo và hộp thoại.
- [ ] Bổ sung màu cho trạng thái hover, focus, đang chọn và vô hiệu hóa.
- [ ] Khai báo `color-scheme` phù hợp để các thành phần mặc định của trình duyệt hỗ trợ giao diện tối.

Bước 3 — Điều chỉnh Login và intro
- [ ] Áp dụng bộ màu tối cho nền intro, Room 01–04, biểu tượng WiFi và vòng sóng.
- [ ] Giữ nhãn phòng rõ ràng; giảm độ chói của hiệu ứng phát sáng.
- [ ] Dùng nền form đủ tách biệt với đồ họa phía sau.
- [ ] Đồng bộ màu nền chuyển cảnh từ Login sang Dashboard theo chế độ đang chọn.

Bước 4 — Điều chỉnh sơ đồ và dữ liệu
- [ ] Đổi nền sơ đồ, lưới, đường viền phòng và nhãn theo chế độ.
- [ ] Giữ tag đang chọn nổi bật và các trạng thái dễ phân biệt.
- [ ] Kết hợp màu với biểu tượng hoặc nhãn cho cảnh báo, mất kết nối và offline.
- [ ] Cập nhật màu biểu đồ, chú giải, tooltip và skeleton.
- [ ] Nếu sơ đồ hoặc biểu đồ dùng canvas, cập nhật cấu hình màu và vẽ lại khi đổi chế độ.

Bước 5 — Thêm bộ chọn giao diện
- [ ] Tạo bộ chọn gồm “Sáng”, “Tối” và “Theo thiết bị”.
- [ ] Đặt bộ chọn ở header; thêm vị trí dễ tìm trên trang Login.
- [ ] Hiển thị rõ lựa chọn hiện tại bằng nhãn hoặc dấu chọn.
- [ ] Hỗ trợ thao tác bằng bàn phím và tên mô tả cho trình đọc màn hình.

Bước 6 — Xử lý lựa chọn và ghi nhớ
- [ ] Dùng thuộc tính `data-theme` trên phần tử gốc để áp dụng bộ màu.
- [ ] Lưu lựa chọn Sáng / Tối / Theo thiết bị bằng `localStorage`.
- [ ] Khi chưa có lựa chọn, mặc định theo thiết bị.
- [ ] Dùng `prefers-color-scheme` để xác định giao diện khi chọn “Theo thiết bị”.
- [ ] Chỉ tự đổi theo hệ điều hành khi người dùng đang chọn “Theo thiết bị”.
- [ ] Nếu không truy cập được bộ nhớ trình duyệt, vẫn cho phép đổi giao diện trong trang hiện tại.

Bước 7 — Áp dụng giao diện ngay khi tải trang
- [ ] Đọc và áp dụng lựa chọn bằng đoạn xử lý nhỏ trong phần đầu trang, trước khi nội dung được hiển thị.
- [ ] Dùng chung cách khởi tạo cho Login, Dashboard và các trang còn lại.
- [ ] Đặt màu nền ban đầu phù hợp để hạn chế lóe trắng khi tải hoặc chuyển trang.
- [ ] Giữ lựa chọn giao diện khi đăng nhập, đăng xuất và tải lại trang.

Bước 8 — Thêm chuyển màu nhẹ
- [ ] Khi người dùng đổi chế độ, chuyển màu nền, chữ và viền trong khoảng 0,3–0,5 giây.
- [ ] Chỉ áp dụng transition cho các thuộc tính màu cần thiết, tránh dùng `transition: all`.
- [ ] Không làm mờ toàn trang hoặc chạy lại Scroll Reveal khi đổi chế độ.
- [ ] Tắt transition lúc tải trang lần đầu để áp dụng đúng màu ngay.
- [ ] Giảm hoặc bỏ chuyển động khi bật `prefers-reduced-motion`.

Tiêu chí hoàn thành: Các trang có Dark Mode đồng bộ, nội dung dễ đọc, lựa chọn được ghi nhớ và chuyển giữa Login với Dashboard không bị đổi màu đột ngột.


TODO: Gom JavaScript và CSS, cập nhật đường dẫn trong WifiRoom

Mục tiêu: Gom mã JavaScript nội bộ vào một tệp chung và CSS nội bộ vào một tệp chung, giữ nguyên giao diện và chức năng.

Bước 1 — Thống kê các tệp và nơi sử dụng
- [ ] Liệt kê các tệp JS, CSS hiện có và các trang đang sử dụng chúng.
- [ ] Xác định JavaScript, CSS viết trực tiếp trong HTML/JSP.
- [ ] Ghi lại thứ tự tải và các phụ thuộc giữa các đoạn mã.
- [ ] Tách biệt thư viện bên thứ ba; giữ nguyên tệp thư viện và thứ tự tải cần thiết.

Bước 2 — Gom CSS vào một tệp
- [ ] Tạo tệp CSS chung tại thư mục tài nguyên của dự án.
- [ ] Sắp xếp nội dung theo nhóm: biến màu, bố cục chung, thành phần, từng trang, animation và responsive.
- [ ] Giữ thứ tự các quy tắc để tránh thay đổi cách ghi đè CSS.
- [ ] Xử lý selector trùng hoặc quá rộng; giới hạn kiểu riêng bằng lớp của từng trang.
- [ ] Chuyển CSS nội tuyến phù hợp vào tệp chung; giữ lại các giá trị cần sinh động từ dữ liệu.

Bước 3 — Gom JavaScript vào một tệp
- [ ] Tạo tệp JS chung tại thư mục tài nguyên của dự án.
- [ ] Chia mã thành các hàm rõ ràng: giao diện chung, Login, Dashboard, sơ đồ, animation và dark mode.
- [ ] Xử lý biến và hàm trùng tên, giữ đúng thứ tự khởi tạo.
- [ ] Chỉ chạy chức năng khi trang có thành phần tương ứng, tránh lỗi do thiếu phần tử.
- [ ] Tránh gắn sự kiện nhiều lần hoặc khởi tạo animation trùng.
- [ ] Giữ dữ liệu do JSP sinh ra trong trang hoặc thuộc tính `data-*`; không chép biểu thức JSP trực tiếp vào tệp JS tĩnh.
- [ ] Giữ cơ chế áp dụng dark mode sớm để tránh lóe sáng khi tải trang.

Bước 4 — Cập nhật đường dẫn
- [ ] Thay các thẻ tải CSS và JS cũ bằng đường dẫn đến hai tệp chung.
- [ ] Cập nhật cả layout dùng chung, JSP include và các trang riêng.
- [ ] Dùng đường dẫn phù hợp với context path của ứng dụng, tránh lỗi khi chạy dưới tên dự án khác.
- [ ] Sửa các đường dẫn `url(...)` đến ảnh, font và biểu tượng trong CSS theo vị trí tệp mới.
- [ ] Rà soát `import`, đường dẫn tải tài nguyên và các tham chiếu trong JavaScript.
- [ ] Giữ nguyên đường dẫn API, servlet và điều hướng nếu chúng không cần thay đổi.
- [ ] Giữ đúng thứ tự tải thư viện, mã chung và thời điểm khởi tạo trang.

Bước 5 — Kiểm tra ảnh hưởng sau khi gom
- [ ] Xác nhận JS, CSS, ảnh và font tải thành công, không có lỗi 404.
- [ ] Kiểm tra bảng Console để phát hiện lỗi JavaScript.
- [ ] Kiểm tra Login, Dashboard và các trang còn lại để phát hiện CSS ảnh hưởng chéo.
- [ ] Kiểm tra header, dropdown, sơ đồ phòng, dark mode, Scroll Reveal và chuyển cảnh đăng nhập.
- [ ] Kiểm tra trực tiếp các trang có đường dẫn lồng nhau và khi tải lại trang.
- [ ] Chạy dự án trong NetBeans để xác nhận tài nguyên vẫn được phục vụ đúng.

Bước 6 — Dọn tệp cũ
- [ ] Chỉ xóa các tệp JS/CSS cũ sau khi đã chuyển đầy đủ nội dung và xác nhận không còn nơi sử dụng.
- [ ] Xóa các thẻ tải trùng và đoạn mã nội tuyến đã được thay thế.
- [ ] Tìm lại toàn dự án để bảo đảm không còn tham chiếu đến đường dẫn cũ.
- [ ] Ghi chú các nhóm mã trong hai tệp chung để dễ bảo trì.

Tiêu chí hoàn thành: Mã JS và CSS nội bộ được gom vào hai tệp chung, các đường dẫn hoạt động đúng, giao diện và chức năng hiện có được giữ nguyên.

TODO: Thêm chuyển cảnh mượt giữa Area, Analytics và các mục khác

**Cập nhật triển khai — 13/10/2026:** Đã thêm chuyển cảnh trong `main.js`, `style.css` và phần bootstrap sớm của `theme.js`; giữ nguyên cấu trúc các trang HTML riêng.

- Vùng main rời trong 0,25 giây và xuất hiện trong 0,8 giây với trượt 10px; header nằm ngoài animation. Thẻ trong viewport chạy một lần, lệch 0,1 giây, tổng độ trễ tối đa 0,4 giây. Scroll Reveal tiếp tục phụ trách phần tử dưới viewport.
- Áp dụng cho Dashboard, Areas, Surveys, Sessions, Session details và Analytics. Menu phản hồi ngay; bấm mục hiện tại không tải lại. AbortController và kiểm tra lượt hiện tại bảo đảm lựa chọn mới nhất thắng. Chỉ main đang rời bị inert; menu vẫn hoạt động.
- Tải trước trang đích đồng thời với hiệu ứng rời trên HTTP(S); không thay HTML trong trang hiện tại. Giữ URL/query/hash và dùng điều hướng trình duyệt bình thường, không can thiệp history/scroll restoration. Ctrl/Cmd/Shift-click, download và target khác vẫn dùng hành vi gốc.
- Nếu còn tải sau hiệu ứng rời, hiện skeleton dạng thẻ hoặc bảng theo trang đích; main giữ chỗ để tránh nhảy bố cục. Lỗi HTTP/mạng hoặc timeout khôi phục nội dung và có Try again. File preview bỏ qua fetch và điều hướng trực tiếp.
- Có fallback kết thúc animation 300ms, timeout tải 10 giây và khôi phục nếu điều hướng chưa hoàn tất sau 5 giây. Dấu sessionStorage gắn với URL đích, hết hạn sau 15 giây, được đọc/xóa sớm; Back/Forward không chạy lại hiệu ứng vào trang. Màu dùng token theme, reduced motion bỏ animation, không JavaScript vẫn dùng liên kết gốc.
- Đã kiểm tra cú pháp và kiểm tra logic Node: mở tab bằng phím bổ trợ, mục hiện tại, chọn liên tiếp, kết quả cũ, Back, lỗi tải và thử lại đều đạt. Chưa nghiệm thu độ mượt, bố cục skeleton và hành vi mạng thực tế trong trình duyệt vì phiên hiện không có trình duyệt kết nối; giữ các checkbox nghiệm thu chưa đánh dấu.

Mục tiêu: Khi chuyển mục, nội dung cũ biến mất nhẹ và nội dung mới xuất hiện chậm, mượt; header và sidebar giữ ổn định.

Bước 1 — Tách vùng chuyển cảnh
- [ ] Xác định vùng nội dung chính cần thay đổi khi chuyển mục.
- [ ] Giữ header và sidebar bên ngoài vùng animation.
- [ ] Tạo các trạng thái CSS: đang rời, đang tải và đang xuất hiện.
- [ ] Đặt CSS và JavaScript vào các tệp chung hiện có, chia nhóm rõ ràng.

Bước 2 — Xử lý khi chọn menu
- [ ] Cập nhật trạng thái mục được chọn ngay khi người dùng bấm.
- [ ] Không chạy lại chuyển cảnh khi bấm vào mục đang mở.
- [ ] Nếu người dùng chọn liên tiếp, ưu tiên lựa chọn mới nhất và hủy chuyển cảnh cũ.
- [ ] Ngăn kết quả tải dữ liệu của mục cũ ghi đè lên mục mới.

Bước 3 — Làm nội dung cũ biến mất
- [ ] Cho vùng nội dung cũ giảm opacity trong 0,2–0,3 giây.
- [ ] Bắt đầu tải nội dung mới đồng thời để giảm thời gian chờ.
- [ ] Chỉ ngăn tương tác với nội dung đang rời; menu vẫn sử dụng được.
- [ ] Có cơ chế dự phòng để tiếp tục điều hướng nếu sự kiện kết thúc animation không chạy.

Bước 4 — Phối hợp điều hướng
- [ ] Nếu nội dung được thay trong cùng trang, giữ khung bố cục và thay nội dung bên trong sau hiệu ứng rời.
- [ ] Nếu mỗi mục tải một trang riêng, lưu dấu chuyển cảnh tạm thời và áp dụng hiệu ứng xuất hiện ở trang đích.
- [ ] Với trang tải riêng, đồng bộ màu nền và tải CSS cần thiết sớm để hạn chế lóe trắng.
- [ ] Giữ nguyên URL, tham số lọc và chức năng Quay lại/Tiến của trình duyệt.
- [ ] Không cản thao tác mở liên kết trong tab mới.

Bước 5 — Hiển thị trạng thái tải
- [ ] Khi dữ liệu chưa sẵn sàng, hiển thị skeleton theo bố cục của mục đích.
- [ ] Giữ kích thước vùng nội dung hợp lý để tránh trang nhảy đột ngột.
- [ ] Không thêm thời gian chờ giả khi dữ liệu đã sẵn sàng.
- [ ] Nếu tải thất bại, hiện thông báo và nút thử lại; không để màn hình trống.

Bước 6 — Cho nội dung mới xuất hiện
- [ ] Dùng fade-in kết hợp trượt lên khoảng 8–12px.
- [ ] Đặt thời gian 0,6–0,9 giây với `ease-out`.
- [ ] Ưu tiên `transform` và `opacity` để chuyển động nhẹ.
- [ ] Cho phép thao tác ngay khi nội dung sẵn sàng, không chờ hiệu ứng trang trí kết thúc.
- [ ] Áp dụng cùng phong cách cho Area, Analytics và các mục còn lại.

Bước 7 — Tạo nhịp cho các thẻ bên trong
- [ ] Cho các thẻ trong màn hình xuất hiện lần lượt, cách nhau 0,08–0,12 giây.
- [ ] Giới hạn độ trễ tổng để các thẻ cuối không phải chờ lâu.
- [ ] Phân công hiệu ứng rõ ràng: khung nội dung chuyển cảnh, các thẻ chỉ chạy hiệu ứng xuất hiện một lần.
- [ ] Với section dưới màn hình, dùng Scroll Reveal khi cuộn tới.
- [ ] Tránh khởi tạo lại animation hoặc sự kiện nhiều lần sau mỗi lần chuyển mục.

Bước 8 — Hoàn thiện hành vi và khả năng truy cập
- [ ] Khi chuyển mục mới, đưa vùng nội dung về đầu; giữ hành vi khôi phục vị trí phù hợp khi dùng Quay lại.
- [ ] Với điều hướng trong cùng trang, chuyển focus hợp lý đến tiêu đề nội dung mới.
- [ ] Giảm hoặc bỏ hiệu ứng khi bật `prefers-reduced-motion`.
- [ ] Đồng bộ nền chuyển cảnh với chế độ sáng và tối.
- [ ] Bảo đảm nội dung vẫn hiển thị và liên kết vẫn hoạt động nếu animation không chạy.

Tiêu chí hoàn thành: Chuyển mục mềm mại, menu phản hồi ngay, header và sidebar ổn định; không bị kẹt chuyển cảnh, hiển thị nhầm nội dung hoặc lặp animation.

# Admin user management

Implemented in `admin.html`, with shared styles in `style.css` and preview dialog behavior in `main.js`. Open **Admin** from the workspace menu.

The static English preview includes five roles, active and locked sample accounts, matching statistics, filter and pagination controls, and create/edit/reset-password/lock/unlock/delete dialogs. Hidden alternate states cover empty lists, no matches, loading errors and access denied. Light/Dark appearance, responsive tables, keyboard dialog dismissal and focus restoration use the shared components. No account data is changed or sent to a server.
