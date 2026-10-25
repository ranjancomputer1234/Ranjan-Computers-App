# Screen inventory

Reference frames come from `REDI-App-UI-Design (2).html` (inner content ~368×822 after the 11px phone border; app uses fluid layout, not a fake phone chrome).

| # | Reference | Route | File | Tabs | Primary actions | API | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | Home Dashboard | `HomeTab/Home` | `src/screens/home/HomeScreen.tsx` | shown | Search, free/paid, live join, explore, continue | home, live | UI + mock |
| 02 | Computer Courses | `ComputerCourses` / `CoursesHome` | `src/screens/catalog/CatalogScreen.tsx` | shown | Search, chips, open course | courses list | UI + mock |
| 03 | Competitive Exams | `CompetitiveExams` | `src/screens/exams/CompetitiveExamsScreen.tsx` | shown | Open exam detail | exams list | UI + mock |
| 04 | Daily News | `DailyNews` | `src/screens/news/DailyNewsScreen.tsx` | shown | Open news feed | news categories | UI + mock |
| 05 | General Awareness | `GeneralAwareness` | `src/screens/awareness/GeneralAwarenessScreen.tsx` | shown | Open topic | awareness topics | UI + mock |
| 06 | Amazing Facts | `AmazingFacts` | `src/screens/facts/AmazingFactsScreen.tsx` | shown | Open facts list | fact categories | UI + mock |
| 07 | Live Class Room | `LiveRoom` | `src/screens/live/LiveRoomScreen.tsx` | shown | Join, chat, raise hand | live join/chat | UI + mock stream URL |
| 08 | Search Results | `Search` | `src/screens/search/SearchScreen.tsx` | shown | Query, recents, open targets | search | UI + mock |
| 09 | Course Detail | `CourseDetail` | `src/screens/courses/CourseDetailScreen.tsx` | shown | Tabs, enroll/buy/resume | course, lessons | UI + mock |
| 10 | Lesson Player | `LessonPlayer` | `src/screens/lessons/LessonPlayerScreen.tsx` | shown | Play, notes/docs, complete | lesson, progress | UI + sample MP4 |
| 11 | Interview Prep | `InterviewPrep` | `src/screens/interview/InterviewPrepScreen.tsx` | shown | Categories, practice, 1:1 CTA | interview | UI + mock |
| 12 | Exam Detail | `ExamDetail` | `src/screens/exams/ExamDetailScreen.tsx` | shown | Syllabus/tests, start mock | exam, tests | UI + mock |
| 13 | Daily Quiz | `DailyQuiz` | `src/screens/assessments/DailyQuizScreen.tsx` | hidden | Answer, timer, submit | attempt | UI + mock |
| 14 | News Feed | `NewsFeed` | `src/screens/news/NewsFeedScreen.tsx` | shown | Featured + list | news | UI + mock |
| 15 | News Article | `NewsArticle` | NewsScreens | shown | Read, save, share | article | UI + mock |
| 16 | Topic Detail | `TopicDetail` | `src/screens/awareness/TopicDetailScreen.tsx` | shown | Search pairs | topic | UI + mock |
| 17 | Facts List | `FactsList` | `src/screens/facts/FactsListScreen.tsx` | shown | React, share, quiz | facts | UI + mock |
| 18 | My Learning | `MyLearning` | `src/screens/learning/MyLearningScreen.tsx` | shown | Resume, saved | enrollments, bookmarks | UI + mock |
| 19 | Profile | `ProfileHome` | `src/screens/profile/ProfileScreen.tsx` | shown | Account menu | me, documents | UI + mock |
| 20 | Notifications | `Notifications` | `src/screens/notifications/NotificationsScreen.tsx` | shown | Open, clear all | inbox | UI + mock |
| 21 | Settings | `Settings` | `src/screens/settings/SettingsScreen.tsx` | shown | Toggles, logout | preferences | UI + local prefs |
| 22 | Checkout | `Checkout` | `src/screens/payments/CheckoutScreen.tsx` | hidden | Coupon, pay | quote, order, verify | UI + mock payment |
| 23 | Payment Success | `PaymentSuccess` | CheckoutScreens | hidden | Start / My Learning | order | UI + mock |
| 24 | My Course · Semesters | `SemesterOutline` | `src/screens/semesters/SemesterOutlineScreen.tsx` | shown | Open semester | semesters | UI + mock |
| 25 | Semester Wait | `SemesterWait` | SemesterScreens | hidden | Refresh status | semester | UI + mock pending |
| 26 | Test Result | `TestResult` | `src/screens/assessments/TestResultScreen.tsx` | shown | Review, retry | result | UI + mock |
| 27 | Live Schedule | `LiveSchedule` | LiveScreens | shown | Join / watch / remind | schedule | UI + mock |
| 28 | Downloads | `Downloads` | `src/screens/downloads/DownloadsScreen.tsx` | shown | Filter, usage | downloads | UI + mock bytes |
| 29 | Edit Profile | `EditProfile` | ProfileScreen | shown | Save | PATCH me | UI + mock |
| 30 | Admit Card | `AdmitCard` | `src/screens/documents/AdmitCardScreen.tsx` | shown | PDF, share | document | UI + mock |
| 31 | Certificate | `Certificate` | DocumentScreens | shown | PDF, share | document | UI + mock |
| 32 | Login | `Login` | `src/screens/auth/LoginScreen.tsx` | hidden | Login, Google, guest | auth | UI + mock |
| 33 | First-run setup | `Onboarding` | `src/screens/onboarding/OnboardingScreen.tsx` | hidden | Learning focus, language, guest/login/register | local preferences | UI + local prefs |

## Supporting flows (inferred, not extra HTML frames)

| Flow | Entry | Route / UI |
| --- | --- | --- |
| Registration | Login | `Register` |
| First run | Splash | `Onboarding`; chosen focus is prioritised on Home and editable in Settings |
| OTP verify | Register / reset | `VerifyContact` |
| Password reset | Login | `ForgotPassword`, `ResetPassword` |
| Explore all sections | Home See All | `ExploreSections` |
| Filters | Catalogues / search | scope-specific inline chips; no dead route |
| Enrolled list | Profile / Learning | `EnrolledCourses` |
| Semester content | Outline | `SemesterContent` |
| Project submit | Semester | `ProjectDetail` |
| Test list / instructions | Exam | `TestList`, `TestInstructions` |
| Formal runner | Instructions | `TestRunner` |
| Result history | Profile | `ResultHistory` |
| Interview / fact readers | Rows | `InterviewQuestion`, `FactDetail` |
| Document list | Profile | `DocumentList` |
| Payment outcomes / history | Checkout / Settings | `PaymentSuccess`, `PaymentFailure`, `PaymentPending`, `PaymentHistory`, `OrderDetail` |
| Subscription | Settings | `Subscription` (capability-honest) |
| Help / feedback / about / legal | Profile / Settings | `HelpSupport`, `Feedback`, `About`, `Legal` |
