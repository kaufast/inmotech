import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isSpanish = locale === 'es-MX';
  
  return {
    title: isSpanish 
      ? 'InmoTech - Plataforma de Tecnología e Inversión Inmobiliaria'
      : 'InmoTech - Real Estate Technology and Investment Platform',
    description: isSpanish
      ? 'Plataforma avanzada de tecnología inmobiliaria e inversión. Conecta inversores con oportunidades inmobiliarias de alta calidad.'
      : 'Advanced real estate technology and investment platform. Connect investors with high-quality real estate opportunities.',
    keywords: isSpanish
      ? 'inmobiliaria, inversión, tecnología, propiedades, análisis, portafolio'
      : 'real estate, investment, technology, properties, analytics, portfolio',
    authors: [{ name: 'InmoTech Development Team' }],
    creator: 'InmoTech',
    publisher: 'InmoTech',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://inmotech.com'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en-GB': '/en-GB',
        'es-MX': '/es-MX',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'es-MX' ? 'es_MX' : 'en_GB',
      url: `https://inmotech.com/${locale}`,
      title: isSpanish 
        ? 'InmoTech - Plataforma de Tecnología e Inversión Inmobiliaria'
        : 'InmoTech - Real Estate Technology and Investment Platform',
      description: isSpanish
        ? 'Plataforma avanzada de tecnología inmobiliaria e inversión. Conecta inversores con oportunidades inmobiliarias de alta calidad.'
        : 'Advanced real estate technology and investment platform. Connect investors with high-quality real estate opportunities.',
      siteName: 'InmoTech',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: isSpanish ? 'Plataforma InmoTech' : 'InmoTech Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isSpanish 
        ? 'InmoTech - Plataforma de Tecnología e Inversión Inmobiliaria'
        : 'InmoTech - Real Estate Technology and Investment Platform',
      description: isSpanish
        ? 'Plataforma avanzada de tecnología inmobiliaria e inversión. Conecta inversores con oportunidades inmobiliarias de alta calidad.'
        : 'Advanced real estate technology and investment platform. Connect investors with high-quality real estate opportunities.',
      images: ['/og-image.jpg'],
      creator: '@inmotech',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: Props) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}