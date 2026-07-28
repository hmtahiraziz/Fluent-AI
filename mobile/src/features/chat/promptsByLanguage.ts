import { SUGGESTED_PROMPTS, CHAT_QUICK_REPLIES } from '../../constants/chatPrompts';

const PROMPTS_BY_LANGUAGE: Record<string, readonly string[]> = {
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
};

const QUICK_REPLIES_BY_LANGUAGE: Record<string, readonly string[]> = {
  ur: ['میں پارک گیا', 'بہت دھوپ تھی', 'یہ کیسے کہتے ہیں...؟'],
  es: ['Fuí al parque', 'Hacía mucho sol', '¿Cómo se dice...?'],
  ar: ['ذهبت إلى الحديقة', 'كان الجو حاراً', 'كيف نقول...؟'],
  hi: ['मैं पार्क गया', 'बहुत धूप थी', 'यह कैसे कहते हैं...?'],
  fr: ['Je suis allé au parc', 'Il faisait très chaud', 'Comment dit-on... ?'],
};

export function getSuggestedPrompts(targetLanguage: string): readonly string[] {
  return PROMPTS_BY_LANGUAGE[targetLanguage] ?? SUGGESTED_PROMPTS;
}

export function getQuickReplies(targetLanguage: string): readonly string[] {
  return QUICK_REPLIES_BY_LANGUAGE[targetLanguage] ?? CHAT_QUICK_REPLIES;
}
