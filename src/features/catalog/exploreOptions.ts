import type {IconName} from '../../assets/icons';
import type {ClayVariantName} from '../../core/types';
import type {HomeNav} from '../../navigation/types';

export type ExploreOption = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: readonly string[];
  icon: IconName;
  clay: ClayVariantName;
  open: (navigation: HomeNav) => void;
};

/** The six learning paths shown on Home and on the Explore directory. */
export const exploreOptions: readonly ExploreOption[] = [
  {
    id: 'computer-courses',
    title: 'Computer Courses',
    subtitle: 'Skills, one lesson at a time',
    description:
      'Guided computer lessons, from everyday tools to job-ready skills. Start free or continue with a paid course.',
    highlights: ['Lessons', 'Free & paid', 'Step by step'],
    icon: 'monitor',
    clay: 'blue',
    open: navigation => navigation.navigate('ComputerCourses'),
  },
  {
    id: 'competitive-exam',
    title: 'Competitive Exam',
    subtitle: 'Prepare with a clear plan',
    description:
      'Syllabus, practice sets, and exam paths together, so preparation has a clear next step.',
    highlights: ['Syllabus', 'Practice sets', 'Exam paths'],
    icon: 'trophy',
    clay: 'orange',
    open: navigation => navigation.navigate('CompetitiveExams'),
  },
  {
    id: 'news',
    title: 'News',
    subtitle: 'Stay current, every day',
    description:
      'Short daily stories written for learners — easy to read now and easy to find again.',
    highlights: ['Daily brief', 'Topics', 'Saved stories'],
    icon: 'news',
    clay: 'cyan',
    open: navigation => navigation.navigate('DailyNews'),
  },
  {
    id: 'general-awareness',
    title: 'General Awareness',
    subtitle: 'GK you can revise quickly',
    description:
      'Static general knowledge, organised by topic, for the exams that ask it again and again.',
    highlights: ['By subject', 'Quick revise', 'Exam GK'],
    icon: 'globe',
    clay: 'green',
    open: navigation => navigation.navigate('GeneralAwareness'),
  },
  {
    id: 'amazing-facts',
    title: 'Amazing Facts',
    subtitle: 'Curious reads, one fact at a time',
    description:
      'Science, history, nature, and the world — memorable facts in a quick read.',
    highlights: ['Science', 'History', 'Quick reads'],
    icon: 'bulb',
    clay: 'purple',
    open: navigation => navigation.navigate('AmazingFacts'),
  },
  {
    id: 'interview-prep',
    title: 'Interview Prep',
    subtitle: 'Practice before you walk in',
    description:
      'Question sets and model answers, so the interview is practice and not a surprise.',
    highlights: ['Question sets', 'Model answers', 'HR and technical'],
    icon: 'mic',
    clay: 'mint',
    open: navigation => navigation.navigate('InterviewPrep'),
  },
];
