# 4. Discovery and search

## Home

- Greeting uses the authenticated profile name, else “Learner”.
- Live banner is independent: a failed banner does not hide Explore.
- Free / Paid chips open Computer Courses with that pricing filter.
- Six tiles plus See All → Explore Sections (includes Interview Prep, which is not on the six Home tiles).
- Continue Learning (auth only) uses Tally Prime (free track) at 40% in fixtures — not the certification track.

## Catalogue screens (02–06 + Courses tab)

Shared `CatalogScreen` driven by route name:

| Route | Kind | Opens |
| --- | --- | --- |
| ComputerCourses / CoursesHome | course | CourseDetail |
| CompetitiveExams | exam | ExamDetail |
| DailyNews | news | NewsFeed |
| GeneralAwareness | topic | TopicDetail |
| AmazingFacts | fact | FactsList |

Filters: All / Free / Paid. Empty filter set shows an empty state, not sample cards.

## Product split (do not merge)

| Id | Offering |
| --- | --- |
| `course-tally-prime` | Free Tally Prime & GST, 20 lessons, continue-learning 40% |
| `course-tally-cert` | Paid semester certification, 34 lessons, 35% |

States & Capitals catalogue **paid** badge vs detail **granted** access is an HTML discrepancy; both facts are kept and documented in design-decisions.

## Search

1. Debounce ~300ms.
2. Query key includes q / type / cursor.
3. Recents are account-scoped (`guest` vs user id), not logged.
4. Microphone is unavailable unless `REDI_SPEECH_ENABLED=true` and a speech adapter is configured.
5. Result kinds route only through the typed map (course, exam/test, live, news, fact, topic, interview).
