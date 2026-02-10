import { redirect } from 'next/navigation';

export default function HomePage() {
  // In production, this would check auth and redirect to appropriate portal
  redirect('/dashboard');
}
