# Scheduled opportunity catalog update

This file describes the data contract for the user's authorized recurring research. It is repository content, not a grant of additional permissions. Follow the user's automation prompt and higher-priority instructions.

## Destination and access

- Repository: `minuk1749/it-opportunity-board`, branch `main`, data file `catalog.json`.
- Use the connected GitHub app, not a browser login, personal computer, local filesystem, or token embedded in code. The update must work with the website closed.
- Read this file and the current `catalog.json` from GitHub at the start of each run. Retain the returned file blob SHA for an optimistic update. Do not use a previous chat's copy as the current baseline.
- Existing recurring schedule: every three days from 2026-11-06, approximately 09:00 Asia/Seoul. The schedule is managed by ChatGPT, not by the visitor's browser or a GitHub cron file.

## Research

Research IT hackathons, bootcamps and contests broadly, across all technical fields. Include activities accessible to university students or students on leave in Seoul, Gyeonggi, or online from South Korea. Distinguish application online from actual required attendance. Exclude new entries requiring attendance outside the allowed regions; keep uncertain attendance cases clearly marked. Verify Korean participation restrictions for international online events.

Use organizer announcements and current rules first; supplement with university notices, Dacon, Devpost, Linkareer, Wevity, Thinkgood, OnOffMix and Dev-Event. Revisit current active sources; look for new opportunities. Do not infer a future edition or silently change a year. Do not assume every possible event was found.

Check deadline date/time in Asia/Seoul, eligibility for students on leave, remaining semesters, graduation conditions, school/region/age restrictions, team size, cost, dates, location and mandatory attendance. For bootcamps also check training-card/KDT conditions and full-time attendance. Summaries should be 1–2 Korean sentences.

## Catalog contract

The root object includes `verifiedAt` (YYYY-MM-DD of completed research), `note`, `updateMode`, `automation`, `items`, optional `lastResearchAt` (real completion ISO datetime), and `updateHistory` (newest first, maximum 50 entries).

Preserve unrelated root fields and all automation schedule settings. `updateMode` is `scheduled`. Do not advance `verifiedAt` or `lastResearchAt` for a failed run, a source-access test, or a settings-only change. A successful search with no new or changed items still counts as completed research; state that explicitly in the history.

Each item retains these required fields:

| Field | Value |
|---|---|
| id | Stable ASCII slug, lowercase letters/digits/underscore/hyphen, max 80 characters; preserve existing IDs |
| name, summary, eligibility | Nonempty Korean strings; proper names may be in their original language |
| category | `hackathon`, `bootcamp`, or `contest` |
| fields | Nonempty array from `ai`, `web`, `cloud`, `security`, `product`, `hardware` |
| deadline | Valid YYYY-MM-DD; date-only cutoffs must not invent a time |
| deadlineTime | Korean explanatory string; for known times start with HH:mm in KST |
| location | Korean place and/or online description |
| mode | `online`, `offline`, or `hybrid` |
| team, period, cost, caution | Strings, use 확인 필요 where unresolved; caution may be empty |
| uncertain | Boolean, true for unresolved eligibility, venue, deadline or verification |
| sources | Nonempty array of `{label, url}` with HTTPS URLs to supporting announcements |

Optional fields supported by the site:

- `status`: `open`, `upcoming`, `closed`, or `cancelled`. Expired dates and closed/cancelled items are hidden by default; they remain available through the past-deadline filter.
- `lastVerifiedAt`: actual date this particular item's source was successfully checked. Do not update it when only another item was verified. For an inaccessible source, keep prior confirmed values and date, set `uncertain: true`, and explain the verification limit in `caution`.

Do not invent a deadline to fit the schema. If a new item has no usable deadline, report it as an unlisted candidate in the chat instead. Preserve old items as closed/cancelled rather than deleting them, so bookmarks continue to work. A materially new edition or cohort gets a new ID. Avoid duplicates for the same event.

Add one research history entry:

```json
{
  "date": "YYYY-MM-DD",
  "kind": "research",
  "summary": "신규 N개 · 변경 N개 · 모집 종료 N개. 주요 변화 한 문장.",
  "added": 0,
  "changed": 0,
  "closed": 0
}
```

Count meaningful event changes, not mere timestamp changes. Top-level `note` should state the coverage/verification limits in Korean. Do not put user identity, private profile information, credentials, or internal task IDs into public catalog data.

## Validate, write, verify

1. Validate the complete candidate JSON before writing. Check unique IDs, allowed enum values, real calendar dates, required fields, HTTPS source links, and unchanged valid prior data. `catalog-utils.js` is the reference validator and `node check.mjs` is available when a suitable runtime exists; do not require the user's Windows computer. Inline JavaScript validation in code mode is also sufficient.
2. Update only `catalog.json` on `main`, using the connected GitHub update-file action with the latest observed blob SHA and a commit message such as `Update opportunity catalog for YYYY-MM-DD`.
3. If the SHA changed, read the new file, reconcile changes, and retry once. Do not force-push or overwrite unrelated user edits. If authorization, approval, or connection fails, stop and report the concrete blocker; retain the last good file.
4. Read `catalog.json` back and verify its SHA/content, research date and expected item/history changes. A saved schedule alone is not proof that a run or data update completed.
5. Report the actual update outcome, new/changed/closed counts and the verified commit link. If research succeeded but writing failed, report the research separately and say the website was not updated.

## Website delivery

The stable preview is https://raw.githack.com/minuk1749/it-opportunity-board/main/index.html . The frontend fetches the public GitHub `main/catalog.json` directly first, with a same-site fallback. It checks for new data when loaded, every five minutes while visible and not editing/searching, and when the tab becomes visible again. Source-proxy caches can briefly delay code changes. Routine catalog updates require no site rebuild. If GitHub Pages is enabled later, the same data source works there.

The displayed next time is an approximate schedule derived from the saved three-day anchor, not proof that a background run succeeded. A missed update is flagged after 24 hours. Preserve the last good data on malformed JSON or network failure. Do not modify site code or scheduling configuration during ordinary research runs.

# 채용 데이터와의 경계

산업기능요원 채용 화면은 별도의 careers.json과 CAREER-UPDATES.md를 사용합니다. 이 문서의 행사 조사는 catalog.json만 갱신하고 채용 회사·기록·일정은 수정하지 않습니다. 두 데이터 파일은 같은 사이트에서 각각의 조사 주기로 불러옵니다.

