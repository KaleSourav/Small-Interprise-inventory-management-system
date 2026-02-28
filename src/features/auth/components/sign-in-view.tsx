import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { IconStar } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { InteractiveGridPattern } from './interactive-grid';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your perfume store account.'
};

export default function SignInViewPage({ stars }: { stars: number }) {
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          Perfume Store
        </div>
        <InteractiveGridPattern
          className={cn(
            "mask-[radial-gradient(400px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[0%] h-full skew-y-12"
          )}
        />
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Manage your perfume inventory with elegance and precision.&rdquo;
            </p>
            <footer className="text-sm">Perfume Store Admin</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="flex w-full max-w-md flex-col items-center justify-center space-y-6">
          <Link
            className={cn("group inline-flex hover:text-yellow-200")}
            target="_blank"
            href="https://github.com/kiranism/next-shadcn-dashboard-starter"
          >
            <div className="flex items-center">
              <GitHubLogoIcon className="size-4" />
              <span className="ml-1 inline">Star on GitHub</span>
            </div>
            <div className="ml-2 flex items-center gap-1 text-sm md:flex">
              <IconStar
                className="size-4 text-gray-500 transition-all duration-300 group-hover:text-yellow-300"
                fill="currentColor"
              />
              <span className="font-display font-medium">{stars}</span>
            </div>
          </Link>
          <div className="w-full rounded-lg border p-8 space-y-4">
            <h2 className="text-2xl font-semibold text-center">Sign In</h2>
            <p className="text-muted-foreground text-sm text-center">
              Supabase authentication — configure your .env.local to enable.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
              <button className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:bg-primary/90">
                Sign In
              </button>
            </div>
          </div>
          <p className="text-muted-foreground px-8 text-center text-sm">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms-of-service"
              className="hover:text-primary underline underline-offset-4"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy-policy"
              className="hover:text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
