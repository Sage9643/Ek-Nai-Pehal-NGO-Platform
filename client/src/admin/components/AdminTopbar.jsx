import { useAdminAuth } from '../hooks/useAdminAuth';
import { getAdminEmailFromToken } from '../utils/adminToken';

export default function AdminTopbar({ onMenuClick, onLogout }) {
  const { token } = useAdminAuth();
  const adminEmail = getAdminEmailFromToken(token);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-forest transition hover:bg-stone-50 lg:hidden"
            aria-label="Open sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div>
            <h1 className="font-playfair text-xl font-bold text-forest sm:text-2xl">Admin Dashboard</h1>
            <p className="hidden text-xs text-stone-500 sm:block">Overview of your organization data</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs uppercase tracking-wider text-stone-400">Signed in as</p>
            <p className="max-w-[220px] truncate text-sm font-medium text-forest">{adminEmail}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="btn-outline-forest px-4 py-2 text-xs sm:px-5 sm:text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
