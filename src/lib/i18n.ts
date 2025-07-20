import { getRequestConfig } from 'next-intl/server';

// Static imports to avoid caching issues
import enGbMessages from '../messages/en-GB.json';
import esMxMessages from '../messages/es-MX.json';
import esEsMessages from '../messages/es-ES.json';

const locales = ['en-GB', 'es-MX', 'es-ES'];

// Explicit resource mapping
const messages = {
  'en-GB': enGbMessages,
  'es-MX': esMxMessages,
  'es-ES': esEsMessages,
};

export default getRequestConfig(async ({ locale }) => {
  const validLocale = locales.includes(locale as any) ? locale : 'en-GB';
  
  return {
    locale: validLocale,
    messages: messages[validLocale as keyof typeof messages]
  };
});

export { locales };