import { redirect } from 'next/navigation';

type Props = {
  params: { locale: string };
};

export default function HomePage({ params: { locale } }: Props) {
  redirect(`/${locale}/landing`);
}