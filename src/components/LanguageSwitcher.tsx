'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { locales } from '@/lib/i18n';

// All available locales with their display names
const availableLocales = [
  { code: 'en-GB', name: 'UK', flag: '🇬🇧' },
  { code: 'es-ES', name: 'España', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Mexico', flag: '🇲🇽' }
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLocale = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    
    // Get the path segments after removing the locale
    const segments = pathname.split('/').filter(Boolean);
    const currentLocaleIndex = segments.findIndex(segment => locales.includes(segment as any));
    
    if (currentLocaleIndex !== -1) {
      // Replace the locale segment
      segments[currentLocaleIndex] = newLocale;
    } else {
      // If no locale found, prepend the new locale
      segments.unshift(newLocale);
    }
    
    const newPath = '/' + segments.join('/');
    router.push(newPath);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/80 border border-white/20 text-white p-2.5 rounded-2xl hover:border-white/30 transition-all duration-300 cursor-pointer focus:outline-none focus:border-white/40"
        aria-label="Change language"
      >
        <Globe className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 py-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl min-w-[160px] z-50">
          {availableLocales.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLocale(lang.code)}
              className={`w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-white/10 transition-colors ${
                locale === lang.code 
                  ? 'bg-white/5 text-orange-400' 
                  : 'text-white'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}