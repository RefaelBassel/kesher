import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container max-w-xl py-24 text-center space-y-4">
      <h1 className="font-serif text-6xl text-brand-deep">404</h1>
      <p className="text-lg text-muted-foreground">This page does not exist.</p>
      <Button asChild>
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}
