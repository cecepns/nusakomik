import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, List, UserCircle, FolderIcon, TrendingUp } from 'lucide-react';

/** Tab aktif — bayangan offset kuning #facc15 seperti Header.jsx */
const bottomNavActiveClass =
  'rounded-xl border border-sky-500/50 bg-sky-600 text-white shadow-[0_4px_0_0_#facc15] transition-all duration-200 hover:brightness-105 active:translate-y-px active:shadow-[0_2px_0_0_#facc15] dark:border-cyan-400/40 dark:bg-[#0b355f] dark:text-cyan-50 dark:shadow-[0_4px_0_0_#facc15] dark:hover:brightness-110 dark:active:shadow-[0_2px_0_0_#facc15]';

const bottomNavInactiveClass =
  'rounded-xl border border-transparent text-gray-400 transition-all duration-200 hover:bg-gray-800/70 hover:text-gray-200 dark:hover:bg-gray-800/80';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, path: '/' },
    { id: 'library', label: 'Library', icon: FolderIcon, path: '/library' },
    { id: 'populer', label: 'Populer', icon: TrendingUp, path: '/populer' },
    { id: 'list', label: 'Komik', icon: List, path: '/content' },
    { id: 'account', label: 'Akun', icon: UserCircle, path: '/akun', comingSoon: false },
  ];

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const activeItem = navigationItems.find(item => item.path === currentPath);
    return activeItem ? activeItem.id : 'home';
  };

  const activeTab = getActiveTab();

  const handleNavigation = (item) => {
    if (item.comingSoon) return;
    navigate(item.path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-950 py-1.5 z-50">
      <div className="grid grid-cols-5 gap-0.5 px-0.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 ${
                isActive ? bottomNavActiveClass : bottomNavInactiveClass
              } ${item.comingSoon ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={item.comingSoon}
            >
              <Icon
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={isActive ? 2.25 : 2}
                aria-hidden
              />
              <span
                className={`max-w-full px-0.5 text-center text-[10px] font-medium leading-tight line-clamp-2 ${
                  isActive ? 'font-semibold' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
