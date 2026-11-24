import type {Course, CourseSyllabusItem} from '../../core/types';

type EditorialLesson = {
  ids?: string[];
  titles: string[];
  notes: string;
};

type Editorial = {
  keys: string[];
  description: string;
  outcomes: string[];
  prerequisites?: string[];
  syllabus?: CourseSyllabusItem[];
  lessons?: EditorialLesson[];
};

const PLACEHOLDER_COPY = /dummy|local testing|sample clip|placeholder|lorem ipsum|test video|it a test|for testing|tbd\b|todo\b|xxx+/i;

const EDITORIAL: Editorial[] = [
  {
    keys: ['gst-basics', 'cmw3vzvuj0022v3902sx34gsy', 'gst basics for small business'],
    description:
      'GST Basics for Small Business explains how Goods and Services Tax works for a small shop or service business in India. You will learn what GST is, when a business needs to register, how a tax invoice is read, and how a simple monthly return is put together.',
    outcomes: [
      'Explain GST as a tax on the supply of goods and services',
      'Tell CGST, SGST, and IGST apart',
      'Recognise when a small business needs a GSTIN',
      'Read the main parts of a tax invoice',
      'Follow the steps of a basic monthly return',
    ],
    prerequisites: ['No prior tax experience is required.'],
    syllabus: [
      {
        title: 'What is GST',
        detail: 'Supply, GSTIN, and the three parts of GST, with a simple invoice.',
        durationMinutes: 10,
      },
      {
        title: 'Filing a simple return',
        detail: 'From sales invoices to a basic monthly return and the records a shop should keep.',
        durationMinutes: 12,
      },
    ],
    lessons: [
      {
        ids: ['cmw3vzwh60024v390gl35d01f'],
        titles: ['what is gst'],
        notes: [
          'GST is a tax on the supply of goods and services in India. A kirana shop, a repair counter, or a small service business meets it as soon as it sells to a customer or buys from a registered supplier.',
          'The tax is split into three parts. CGST and SGST apply when the buyer and seller are in the same state. IGST applies when the supply crosses a state border. The rate depends on the goods or service, not on the size of the shop.',
          'A business that crosses the registration threshold, or that needs to sell to other registered businesses, applies for a GSTIN. That number appears on the tax invoice along with the supplier’s name, the invoice number and date, a description of the supply, the taxable value, and the tax amount.',
          'Before you enrol, you should be able to point at an invoice and say which figure is the value of the supply and which figure is the tax. The next lesson uses those invoices to walk through a simple monthly return.',
        ].join('\n\n'),
      },
      {
        ids: ['cmw3vzxj10028v390o9c1xycm'],
        titles: ['filing a simple return'],
        notes: [
          'A monthly GST return is a summary of the supplies you made and the tax you collected. For a small business the practical starting point is the sales invoices for that month, not the return form itself.',
          'List each taxable invoice: the customer, the invoice value, and the GST charged. Add the tax collected. Then list the purchases on which you paid GST to a registered supplier. The tax on those purchases is input tax credit, and it reduces the tax you pay, provided the invoice is in the supplier’s name and the GSTIN is correct.',
          'Tax to pay is the GST collected on sales, minus the eligible input tax credit. Keep the invoices, the summary, and the acknowledgement together. A shop that can produce those three things can explain its return to an accountant or an officer.',
          'This lesson is the written walkthrough. Use your own sample invoices beside it and total one month before you mark the lesson complete.',
        ].join('\n\n'),
      },
    ],
  },
  {
    keys: ['ms-excel-beginners', 'cmw3vzr6s001pv390vs3rpisj', 'ms excel for beginners'],
    description:
      'MS Excel for Beginners is a practical introduction to spreadsheets for office work. You will build a workbook, write everyday formulas, and turn a small table into a chart.',
    outcomes: [
      'Set up a workbook with rows, columns, and clear headings',
      'Use SUM, AVERAGE, and a simple IF',
      'Turn a small table into a column chart',
    ],
    prerequisites: ['No prior spreadsheet experience is required.'],
  },
  {
    keys: ['spoken-english-starter', 'cmw3vzyh4002bv3908nvsme1a', 'spoken english starter'],
    description:
      'Spoken English Starter helps new speakers introduce themselves and handle everyday conversations. The lessons cover your name, city, and work, then asking for directions and ordering food.',
    outcomes: [
      'Introduce yourself in clear spoken English',
      'Ask for directions and understand a short reply',
      'Order food and confirm what you asked for',
    ],
    prerequisites: ['You can read simple English. Spoken practice is part of each lesson.'],
  },
  {
    keys: ['tally-prime-basics', 'cmveuksfd0018v3t4bw7s4bu1', 'tally prime basics'],
    description:
      'Tally Prime Basics introduces the screens and first entries a new accounts student needs. You will learn how a company is opened and how a simple voucher is recorded.',
    outcomes: [
      'Open a company and recognise the main Tally Prime screens',
      'Record a simple voucher without losing the ledger name',
      'Know which report to open to check that entry',
    ],
    prerequisites: ['No prior Tally experience is required.'],
  },
];

/** Syllabus lines from the learner API. The field is a string list; older objects still work. */
export function syllabusItems(value: unknown): CourseSyllabusItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.flatMap(row => {
    if (typeof row === 'string') {
      const title = row.trim();
      if (!title || isPlaceholderCopy(title)) return [];
      return [{title}];
    }
    if (!row || typeof row !== 'object') return [];
    const record = row as {title?: unknown; detail?: unknown; description?: unknown; durationMinutes?: unknown};
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title || isPlaceholderCopy(title)) return [];
    const detailSource = typeof record.detail === 'string'
      ? record.detail
      : typeof record.description === 'string'
        ? record.description
        : undefined;
    const detail = detailSource?.trim();
    const durationMinutes = typeof record.durationMinutes === 'number' && record.durationMinutes > 0
      ? record.durationMinutes
      : undefined;
    return [{
      title,
      ...(detail && !isPlaceholderCopy(detail) ? {detail} : {}),
      ...(durationMinutes ? {durationMinutes} : {}),
    }];
  });
  return items.length ? items : undefined;
}

export function isPlaceholderCopy(value?: string | null): boolean {
  const text = value?.trim() ?? '';
  if (!text) return false;
  return PLACEHOLDER_COPY.test(text);
}

export function isInternalTestCourse(input: {id?: string; title?: string; slug?: string}): boolean {
  const title = input.title?.trim().toLowerCase() ?? '';
  const slug = input.slug?.trim().toLowerCase() ?? '';
  if (slug === 'test1' || title === 'test course') return true;
  return /^test(\s|\d|$)/i.test(title);
}

export function isInternalTestTitle(title?: string | null): boolean {
  return /^test(\s|\d|$)/i.test(title?.trim() ?? '');
}

function editorialFor(course: {id: string; title: string}, slug?: string): Editorial | undefined {
  const keys = new Set([course.id, course.title, slug ?? ''].map(value => value.trim().toLowerCase()).filter(Boolean));
  return EDITORIAL.find(item => item.keys.some(key => keys.has(key)));
}

export function presentCourse(course: Course, slug?: string): Course {
  const editorial = editorialFor(course, slug);
  if (!editorial) return course;
  const description = !course.description || isPlaceholderCopy(course.description)
    ? editorial.description
    : course.description;
  return {
    ...course,
    description,
    outcomes: course.outcomes?.length ? course.outcomes : editorial.outcomes,
    prerequisites: course.prerequisites?.length ? course.prerequisites : editorial.prerequisites,
    syllabus: course.syllabus?.length ? course.syllabus : editorial.syllabus,
  };
}

export function lessonNotes(courseId: string, lessonId: string, title: string, description?: string | null): string | undefined {
  const editorial = EDITORIAL.find(item => item.keys.includes(courseId.toLowerCase()) || item.keys.includes(courseId));
  const match = editorial?.lessons?.find(lesson => {
    const id = lessonId.toLowerCase();
    const name = title.trim().toLowerCase();
    return lesson.ids?.some(item => item.toLowerCase() === id) || lesson.titles.includes(name);
  });
  if (match) return match.notes;
  const existing = description?.trim();
  if (!existing || isPlaceholderCopy(existing)) return undefined;
  return existing;
}

export function formatLearningTime(minutes?: number): string | undefined {
  if (!minutes || !Number.isFinite(minutes) || minutes <= 0) return undefined;
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `${hours} hr ${rest} min` : hours === 1 ? '1 hr' : `${hours} hr`;
}

export function isPlaceholderMedia(url?: string | null): boolean {
  const value = url?.trim() ?? '';
  if (!value) return false;
  return /gtv-videos-bucket|\/sample\/ForBigger|sample-videos|commondatastorage\.googleapis\.com\/gtv/i.test(value);
}
