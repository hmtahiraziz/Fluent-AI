import { languageMeta } from '../../config/constants';
import type { PracticeTopic } from './practiceContext';

export type PracticeTopicChip = {
  id: PracticeTopic | string;
  label: string;
  prompt: string;
};

export type PracticeForYouItem = {
  id: string;
  title: string;
  meta: string;
  emoji: string;
  prompt: string;
  topic?: PracticeTopic;
  scenario?: string;
  category?: string;
  durationMinutes?: number;
  description?: string;
};

type ContentBundle = {
  topics: PracticeTopicChip[];
  forYou: PracticeForYouItem[];
};

/**
 * Practice prompts are written in the target language so the learner practices that language.
 * Chip labels stay short English UI labels for consistency across the app chrome.
 */
const CONTENT_BY_LANGUAGE: Record<string, ContentBundle> = {
  en: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: "Let's practice grammar and sentence structure." },
      { id: 'culture', label: 'Culture', prompt: "Let's explore cultural expressions and customs." },
      { id: 'business', label: 'Business', prompt: 'Help me practice professional business conversations.' },
      { id: 'travel', label: 'Travel', prompt: "Let's practice travel scenarios and asking for directions." },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'Café chat',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'Help me practice ordering and small talk at a café.',
      },
      {
        id: 'email',
        title: 'Email mastery',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'Help me write a clear professional email.',
      },
    ],
  },
  es: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'Practiquemos gramática y la estructura de las oraciones.' },
      { id: 'culture', label: 'Culture', prompt: 'Expliquemos expresiones culturales y costumbres.' },
      { id: 'business', label: 'Business', prompt: 'Ayúdame a practicar conversaciones profesionales de negocios.' },
      { id: 'travel', label: 'Travel', prompt: 'Practiquemos situaciones de viaje y pedir direcciones.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'En el café',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'Ayúdame a practicar pedir en un café y hablar un poco.',
      },
      {
        id: 'email',
        title: 'Correos claros',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'Ayúdame a escribir un correo profesional claro.',
      },
    ],
  },
  ko: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: '문법과 문장 구조를 연습해요.' },
      { id: 'culture', label: 'Culture', prompt: '문화 표현과 예절을 연습해요.' },
      { id: 'business', label: 'Business', prompt: '직장에서 쓰는 정중한 대화를 연습하고 싶어요.' },
      { id: 'travel', label: 'Travel', prompt: '여행할 때 길 묻고 주문하는 말을 연습해요.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: '카페 주문',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: '카페에서 주문하고 간단히 이야기하는 연습을 도와주세요.',
      },
      {
        id: 'email',
        title: '이메일 연습',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: '정중하고 명확한 업무 이메일을 쓰는 연습을 도와주세요.',
      },
    ],
  },
  ja: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: '文法と文の組み立てを練習しましょう。' },
      { id: 'culture', label: 'Culture', prompt: '文化的な表現やマナーを練習しましょう。' },
      { id: 'business', label: 'Business', prompt: '仕事の丁寧な会話を練習したいです。' },
      { id: 'travel', label: 'Travel', prompt: '旅行で道を聞いたり注文したりする練習をしましょう。' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'カフェ会話',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'カフェで注文して少し話す練習を手伝ってください。',
      },
      {
        id: 'email',
        title: 'メール練習',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: '丁寧でわかりやすいビジネスメールを書く練習を手伝ってください。',
      },
    ],
  },
  ar: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'دعنا نتمرّن على القواعد وبناء الجمل.' },
      { id: 'culture', label: 'Culture', prompt: 'دعنا نستكشف التعابير الثقافية والعادات.' },
      { id: 'business', label: 'Business', prompt: 'ساعدني على التدرّب على محادثات العمل المهنية.' },
      { id: 'travel', label: 'Travel', prompt: 'دعنا نتمرّن على مواقف السفر وطلب الاتجاهات.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'في المقهى',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'ساعدني على التدرّب على الطلب والدردشة في مقهى.',
      },
      {
        id: 'email',
        title: 'رسائل العمل',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'ساعدني على كتابة رسالة عمل واضحة ومهنية.',
      },
    ],
  },
  fr: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'Entraînons-nous à la grammaire et à la structure des phrases.' },
      { id: 'culture', label: 'Culture', prompt: 'Explorons des expressions culturelles et des coutumes.' },
      { id: 'business', label: 'Business', prompt: "Aidez-moi à pratiquer des conversations professionnelles." },
      { id: 'travel', label: 'Travel', prompt: 'Entraînons-nous aux situations de voyage et aux directions.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'Au café',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'Aidez-moi à commander et à discuter dans un café.',
      },
      {
        id: 'email',
        title: 'E-mails pro',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'Aidez-moi à écrire un e-mail professionnel clair.',
      },
    ],
  },
  de: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'Lass uns Grammatik und Satzbau üben.' },
      { id: 'culture', label: 'Culture', prompt: 'Lass uns kulturelle Ausdrücke und Bräuche üben.' },
      { id: 'business', label: 'Business', prompt: 'Hilf mir, berufliche Gespräche zu üben.' },
      { id: 'travel', label: 'Travel', prompt: 'Lass uns Reisesituationen und Wegbeschreibungen üben.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'Im Café',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'Hilf mir, im Café zu bestellen und Smalltalk zu üben.',
      },
      {
        id: 'email',
        title: 'E-Mail-Übung',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'Hilf mir, eine klare berufliche E-Mail zu schreiben.',
      },
    ],
  },
  zh: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: '我们来练习语法和句子结构。' },
      { id: 'culture', label: 'Culture', prompt: '我们来练习文化表达和习俗。' },
      { id: 'business', label: 'Business', prompt: '请帮我练习职场商务对话。' },
      { id: 'travel', label: 'Travel', prompt: '我们来练习旅行场景和问路。' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: '咖啡馆点单',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: '请帮我练习在咖啡馆点单和简单聊天。',
      },
      {
        id: 'email',
        title: '商务邮件',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: '请帮我练习写一封清楚、礼貌的工作邮件。',
      },
    ],
  },
  hi: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'आइए व्याकरण और वाक्य संरचना का अभ्यास करें।' },
      { id: 'culture', label: 'Culture', prompt: 'आइए सांस्कृतिक अभिव्यक्तियों का अभ्यास करें।' },
      { id: 'business', label: 'Business', prompt: 'मुझे पेशेवर बातचीत का अभ्यास करवाएँ।' },
      { id: 'travel', label: 'Travel', prompt: 'आइए यात्रा और रास्ता पूछने का अभ्यास करें।' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'कैफ़े बातचीत',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'कैफ़े में ऑर्डर और छोटी बातचीत का अभ्यास करवाएँ।',
      },
      {
        id: 'email',
        title: 'ईमेल अभ्यास',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'एक स्पष्ट पेशेवर ईमेल लिखने का अभ्यास करवाएँ।',
      },
    ],
  },
  ur: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'آئیے گرامر اور جملوں کی ساخت کی مشق کریں۔' },
      { id: 'culture', label: 'Culture', prompt: 'آئیے ثقافتی اظہار اور عادات کی مشق کریں۔' },
      { id: 'business', label: 'Business', prompt: 'مجھے پیشہ ورانہ بات چیت کی مشق کروائیں۔' },
      { id: 'travel', label: 'Travel', prompt: 'آئیے سفر اور راستہ پوچھنے کی مشق کریں۔' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'کافی شاپ',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'کافی شاپ میں آرڈر اور چھوٹی گفتگو کی مشق کروائیں۔',
      },
      {
        id: 'email',
        title: 'ای میل مشق',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'ایک واضح پیشہ ورانہ ای میل لکھنے کی مشق کروائیں۔',
      },
    ],
  },
  it: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'Esercitiamoci sulla grammatica e sulla struttura delle frasi.' },
      { id: 'culture', label: 'Culture', prompt: 'Esploriamo espressioni culturali e usanze.' },
      { id: 'business', label: 'Business', prompt: 'Aiutami a esercitarmi con conversazioni professionali.' },
      { id: 'travel', label: 'Travel', prompt: 'Esercitiamoci con situazioni di viaggio e indicazioni stradali.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'Al bar',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'Aiutami a ordinare e chiacchierare in un bar.',
      },
      {
        id: 'email',
        title: 'Email di lavoro',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'Aiutami a scrivere un’email professionale chiara.',
      },
    ],
  },
  pt: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'Vamos praticar gramática e estrutura das frases.' },
      { id: 'culture', label: 'Culture', prompt: 'Vamos explorar expressões culturais e costumes.' },
      { id: 'business', label: 'Business', prompt: 'Ajude-me a praticar conversas profissionais.' },
      { id: 'travel', label: 'Travel', prompt: 'Vamos praticar situações de viagem e pedir direções.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'No café',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'Ajude-me a praticar pedidos e conversa em um café.',
      },
      {
        id: 'email',
        title: 'E-mail profissional',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'Ajude-me a escrever um e-mail profissional claro.',
      },
    ],
  },
  ru: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'Давайте потренируем грамматику и построение предложений.' },
      { id: 'culture', label: 'Culture', prompt: 'Давайте попрактикуем культурные выражения и обычаи.' },
      { id: 'business', label: 'Business', prompt: 'Помогите мне практиковать деловые разговоры.' },
      { id: 'travel', label: 'Travel', prompt: 'Давайте потренируем дорожные ситуации и просьбы о направлении.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'В кафе',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'Помогите практиковать заказ и небольшой разговор в кафе.',
      },
      {
        id: 'email',
        title: 'Деловое письмо',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'Помогите написать ясное деловое письмо.',
      },
    ],
  },
  tr: {
    topics: [
      { id: 'grammar', label: 'Grammar', prompt: 'Gramer ve cümle yapısını pratik edelim.' },
      { id: 'culture', label: 'Culture', prompt: 'Kültürel ifadeleri ve adetleri pratik edelim.' },
      { id: 'business', label: 'Business', prompt: 'İş konuşmalarını pratik etmeme yardım et.' },
      { id: 'travel', label: 'Travel', prompt: 'Seyahat durumlarını ve yol sormayı pratik edelim.' },
    ],
    forYou: [
      {
        id: 'cafe',
        title: 'Kafede',
        meta: '5 min • Daily',
        emoji: '☕',
        prompt: 'Kafede sipariş verip sohbet etmeyi pratik edelim.',
      },
      {
        id: 'email',
        title: 'İş e-postası',
        meta: '8 min • Work',
        emoji: '✉️',
        prompt: 'Net bir iş e-postası yazmama yardım et.',
      },
    ],
  },
};

const MOTIVATION_FOR_YOU: Record<
  string,
  (lang: string) => PracticeForYouItem | null
> = {
  travel: lang => {
    const prompts: Record<string, string> = {
      en: 'Help me practice asking for directions and booking a hotel room.',
      es: 'Ayúdame a practicar pedir direcciones y reservar un hotel.',
      ko: '길 묻고 호텔을 예약하는 연습을 도와주세요.',
      ja: '道を聞いたりホテルを予約したりする練習を手伝ってください。',
      ar: 'ساعدني على التدرّب على طلب الاتجاهات وحجز غرفة فندق.',
      fr: "Aidez-moi à demander mon chemin et à réserver une chambre d'hôtel.",
      de: 'Hilf mir, nach dem Weg zu fragen und ein Hotelzimmer zu buchen.',
      zh: '请帮我练习问路和预订酒店。',
      hi: 'रास्ता पूछने और होटल बुक करने का अभ्यास करवाएँ।',
      ur: 'راستہ پوچھنے اور ہوٹل بک کرنے کی مشق کروائیں۔',
    };
    const prompt = prompts[lang];
    if (!prompt) return null;
    return {
      id: 'motivation-travel',
      title: 'Travel ready',
      meta: 'Motivation • Travel',
      emoji: '✈️',
      prompt,
    };
  },
  work: lang => {
    const prompts: Record<string, string> = {
      en: 'Help me practice a short professional meeting introduction.',
      es: 'Ayúdame a practicar una breve presentación en una reunión de trabajo.',
      ko: '짧은 업무 미팅 소개 연습을 도와주세요.',
      ja: '短い仕事の会議での自己紹介を練習させてください。',
      ar: 'ساعدني على التدرّب على تقديم نفسي باختصار في اجتماع عمل.',
      fr: "Aidez-moi à m'entraîner à une courte présentation en réunion.",
      de: 'Hilf mir, eine kurze Vorstellung in einem Meeting zu üben.',
      zh: '请帮我练习在工作会议中简短自我介绍。',
      hi: 'मीटिंग में संक्षिप्त परिचय का अभ्यास करवाएँ।',
      ur: 'میٹنگ میں مختصر تعارف کی مشق کروائیں۔',
    };
    const prompt = prompts[lang];
    if (!prompt) return null;
    return {
      id: 'motivation-work',
      title: 'Career boost',
      meta: 'Motivation • Work',
      emoji: '💼',
      prompt,
    };
  },
  school: lang => {
    const prompts: Record<string, string> = {
      en: 'Help me practice answering exam-style oral questions.',
      es: 'Ayúdame a practicar respuestas orales de examen.',
      ko: '시험 구술 질문에 답하는 연습을 도와주세요.',
      ja: '試験の口頭質問に答える練習を手伝ってください。',
      ar: 'ساعدني على التدرّب على الإجابة عن أسئلة شفهية للامتحان.',
      fr: "Aidez-moi à m'entraîner aux questions orales d'examen.",
      de: 'Hilf mir, mündliche Prüfungsfragen zu üben.',
      zh: '请帮我练习回答口语考试问题。',
      hi: 'मौखिक परीक्षा जैसे प्रश्नों का अभ्यास करवाएँ।',
      ur: 'زبانی امتحان جیسے سوالات کی مشق کروائیں۔',
    };
    const prompt = prompts[lang];
    if (!prompt) return null;
    return {
      id: 'motivation-school',
      title: 'Exam practice',
      meta: 'Motivation • School',
      emoji: '🎓',
      prompt,
    };
  },
  family: lang => {
    const prompts: Record<string, string> = {
      en: 'Help me practice warm conversations with family members.',
      es: 'Ayúdame a practicar conversaciones cálidas con la familia.',
      ko: '가족과 따뜻하게 대화하는 연습을 도와주세요.',
      ja: '家族と温かく話す練習を手伝ってください。',
      ar: 'ساعدني على التدرّب على محادثات دافئة مع العائلة.',
      fr: "Aidez-moi à pratiquer des conversations chaleureuses en famille.",
      de: 'Hilf mir, herzliche Gespräche mit der Familie zu üben.',
      zh: '请帮我练习和家人温暖地交谈。',
      hi: 'परिवार के साथ गर्मजोशी भरी बातचीत का अभ्यास करवाएँ।',
      ur: 'خاندان کے ساتھ گرم جوشی والی گفتگو کی مشق کروائیں۔',
    };
    const prompt = prompts[lang];
    if (!prompt) return null;
    return {
      id: 'motivation-family',
      title: 'Family talk',
      meta: 'Motivation • Family',
      emoji: '👨‍👩‍👧',
      prompt,
    };
  },
};

function bundleFor(language: string): ContentBundle {
  return CONTENT_BY_LANGUAGE[language] ?? CONTENT_BY_LANGUAGE.en!;
}

export function getPracticeTopics(targetLanguage: string): PracticeTopicChip[] {
  return [...bundleFor(targetLanguage).topics];
}

export function getPracticeForYouItems(
  targetLanguage: string,
  motivation?: string,
): PracticeForYouItem[] {
  const base = [...bundleFor(targetLanguage).forYou];
  const extra =
    motivation && MOTIVATION_FOR_YOU[motivation]
      ? MOTIVATION_FOR_YOU[motivation]!(targetLanguage)
      : null;
  if (extra) {
    return [extra, ...base.filter(i => i.id !== extra.id)].slice(0, 3);
  }
  return base;
}

/** Whether practice UI strings for this language should use RTL layout. */
export function isRtlTargetLanguage(targetLanguage: string): boolean {
  return Boolean(languageMeta(targetLanguage).rtl);
}
