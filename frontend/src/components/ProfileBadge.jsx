import React from 'react';
import { Shield } from 'lucide-react';

export default function ProfileBadge({ user }) {
  const isAdmin = user?.role === 'admin';
  const accent = isAdmin ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500';
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${accent} shadow-md`}>\n      <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
        <Shield size={24} className={isAdmin ? 'text-purple-400' : 'text-amber-500'} />
      </div>
      <div className="flex flex-col">
        <span className="font-display font-bold text-sm text-slate-200 truncate" title={user?.full_name}>
          {user?.full_name || 'Officer'}
        </span>
        <span className="text-xs text-slate-400">ID: {user?.badge_number}</span>
        <span className="text-xs text-slate-400">Rank: {user?.rank || (isAdmin ? 'DGP' : 'PC')}</span>
      </div>
    </div>
  );
}
