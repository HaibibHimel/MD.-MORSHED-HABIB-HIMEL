import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { downloadCvFile } from '@/src/lib/api';

interface FooterProps {
  fullName: string;
}

export function Footer({ fullName }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#040814] py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
        <p>
          &copy; {new Date().getFullYear()} {fullName}. All rights reserved.
        </p>

        <div className="flex flex-wrap items-center gap-6">
          <a href="#about" className="transition-colors hover:text-white">
            About
          </a>
          <a href="#experience" className="transition-colors hover:text-white">
            Experience
          </a>
          <button
            type="button"
            onClick={() => {
              downloadCvFile().catch(() => {});
            }}
            className="transition-colors hover:text-white"
          >
            Download CV
          </button>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-cyan-300"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
