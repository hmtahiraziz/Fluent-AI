import { SUGGESTED_PROMPTS, CHAT_QUICK_REPLIES } from '../../constants/chatPrompts';

const PROMPTS_BY_LANGUAGE: Record<string, readonly string[]> = {
  en: SUGGESTED_PROMPTS,
  ur: [
    'السلام! میں اپنا تعارف کرنا چاہتا ہوں۔',
    'آج کے بارے میں بات کرتے ہیں۔',
    'مجھے سادہ جملے سکھائیں۔',
    'گرامر کی مشق کریں۔',
  ],
  es: [
    '¡Hola! Me gustaría presentarme.',
    '¿Podemos practicar pedir comida en un restaurante?',
    'Ayúdame a describir mi rutina diaria.',
    'Enséñame a pedir direcciones.',
  ],
  ar: [
    'مرحباً! أود أن أقدم نفسي.',
    'لنتحدث عن يومي.',
    'علّمني عبارات بسيطة.',
    'ساعدني في تصحيح قواعدي.',
  ],
  hi: [
    'नमस्ते! मैं अपना परिचय देना चाहता हूँ।',
    'आज के बारे में बात करते हैं।',
    'मुझे सरल वाक्य सिखाएँ।',
    'व्याकरण का अभ्यास करें।',
  ],
  fr: [
    'Bonjour ! Je voudrais me présenter.',
    'Pouvons-nous pratiquer commander au restaurant ?',
    'Aidez-moi à décrire ma routine.',
    'Apprenez-moi à demander des directions.',
  ],
  de: [
    'Hallo! Ich möchte mich vorstellen.',
    'Können wir das Bestellen im Restaurant üben?',
    'Hilf mir, meinen Tagesablauf zu beschreiben.',
    'Zeig mir, wie ich nach dem Weg frage.',
  ],
  it: [
    'Ciao! Vorrei presentarmi.',
    'Possiamo esercitarci a ordinare al ristorante?',
    'Aiutami a descrivere la mia routine quotidiana.',
    'Insegnami a chiedere indicazioni.',
  ],
  pt: [
    'Olá! Eu gostaria de me apresentar.',
    'Podemos praticar pedir comida em um restaurante?',
    'Ajude-me a descrever minha rotina diária.',
    'Ensine-me a pedir direções.',
  ],
  ja: [
    'こんにちは！自己紹介をしたいです。',
    'レストランで注文する練習ができますか？',
    '毎日のルーティンを説明するのを手伝ってください。',
    '道の聞き方を教えてください。',
  ],
  ko: [
    '안녕하세요! 제 소개를 하고 싶어요.',
    '식당에서 주문하는 연습을 할 수 있을까요?',
    '일상 루틴을 설명하는 걸 도와주세요.',
    '길 묻는 법을 가르쳐 주세요.',
  ],
  zh: [
    '你好！我想自我介绍一下。',
    '我们可以练习在餐厅点餐吗？',
    '帮我描述一下我的日常作息。',
    '教我怎么问路。',
  ],
  tr: [
    'Merhaba! Kendimi tanıtmak istiyorum.',
    'Restoranda sipariş vermeyi pratik edebilir miyiz?',
    'Günlük rutinimi anlatmama yardım et.',
    'Yol sormayı öğret.',
  ],
  ru: [
    'Здравствуйте! Я хочу представиться.',
    'Можем попрактиковать заказ еды в ресторане?',
    'Помогите описать мой распорядок дня.',
    'Научите спрашивать дорогу.',
  ],
  nl: [
    'Hallo! Ik wil mezelf graag voorstellen.',
    'Kunnen we oefenen met bestellen in een restaurant?',
    'Help me mijn dagelijkse routine te beschrijven.',
    'Leer me de weg te vragen.',
  ],
  pl: [
    'Cześć! Chciałbym się przedstawić.',
    'Czy możemy poćwiczyć zamawianie w restauracji?',
    'Pomóż mi opisać moją codzienną rutynę.',
    'Naucz mnie pytać o drogę.',
  ],
  sv: [
    'Hej! Jag skulle vilja presentera mig.',
    'Kan vi öva på att beställa mat på en restaurang?',
    'Hjälp mig att beskriva min dagliga rutin.',
    'Lär mig att fråga om vägen.',
  ],
  id: [
    'Halo! Saya ingin memperkenalkan diri.',
    'Bisakah kita berlatih memesan makanan di restoran?',
    'Bantu saya menjelaskan rutinitas harian saya.',
    'Ajari saya cara menanyakan arah.',
  ],
};

const QUICK_REPLIES_BY_LANGUAGE: Record<string, readonly string[]> = {
  en: CHAT_QUICK_REPLIES,
  ur: ['میں پارک گیا', 'بہت دھوپ تھی', 'یہ کیسے کہتے ہیں...؟'],
  es: ['Fui al parque', 'Hacía mucho sol', '¿Cómo se dice...?'],
  ar: ['ذهبت إلى الحديقة', 'كان الجو حاراً', 'كيف نقول...؟'],
  hi: ['मैं पार्क गया', 'बहुत धूप थी', 'यह कैसे कहते हैं...?'],
  fr: ['Je suis allé au parc', 'Il faisait très chaud', 'Comment dit-on... ?'],
  de: ['Ich bin in den Park gegangen', 'Es war sehr sonnig', 'Wie sagt man...?'],
  it: ["Sono andato al parco", "C'era molto sole", 'Come si dice...?'],
  pt: ['Eu fui ao parque', 'Estava muito sol', 'Como se diz...?'],
  ja: ['公園に行きました', 'とても天気が良かったです', '何と言いますか…？'],
  ko: ['공원에 갔어요', '날씨가 아주 맑았어요', '어떻게 말하나요...?'],
  zh: ['我去了公园', '天气很好', '怎么说…？'],
  tr: ['Parka gittim', 'Hava çok güneşliydi', 'Nasıl denir...?'],
  ru: ['Я ходил в парк', 'Было очень солнечно', 'Как сказать...?'],
  nl: ['Ik ging naar het park', 'Het was erg zonnig', 'Hoe zeg je...?'],
  pl: ['Poszedłem do parku', 'Było bardzo słonecznie', 'Jak się mówi...?'],
  sv: ['Jag gick till parken', 'Det var mycket soligt', 'Hur säger man...?'],
  id: ['Saya pergi ke taman', 'Cuacanya sangat cerah', 'Bagaimana cara bilang...?'],
};

/**
 * Empty-state prompt chips for the conversation language.
 * Falls back to English so learning English never shows Spanish defaults.
 */
export function getSuggestedPrompts(targetLanguage: string): readonly string[] {
  return PROMPTS_BY_LANGUAGE[targetLanguage] ?? SUGGESTED_PROMPTS;
}

/**
 * Composer quick-reply chips for the conversation language.
 * Falls back to English (not Spanish).
 */
export function getQuickReplies(targetLanguage: string): readonly string[] {
  return QUICK_REPLIES_BY_LANGUAGE[targetLanguage] ?? CHAT_QUICK_REPLIES;
}
