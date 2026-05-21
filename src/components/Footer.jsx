import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/logo.png';

function loadHistatsEmbed() {
  if (typeof window === 'undefined') return;

  window._Hasync = window._Hasync || [];
  window._Hasync.push(['Histats.start', '1,5027005,4,387,112,48,00010110']);
  window._Hasync.push(['Histats.fasi', '1']);
  window._Hasync.push(['Histats.track_hits', '']);
  window._Hasync.push(['Histats.framed_page', '']);

  if (!window.__histatsScriptAdded) {
    window.__histatsScriptAdded = true;
    const hs = document.createElement('script');
    hs.type = 'text/javascript';
    hs.async = true;
    hs.src = '//s10.histats.com/js15_as.js';
    (document.head || document.body).appendChild(hs);
  } else {
    window._Hasync.push(['Histats.fasi', '1']);
  }
}

const Footer = () => {
  const navigate = useNavigate();

  useEffect(() => {
    loadHistatsEmbed();
  }, []);

  return (
    <footer className="bg-gray-900 pb-20 dark:bg-primary-950 text-gray-300 dark:text-gray-400 border-t border-gray-800 dark:border-primary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="flex items-center">
            <img
              src={Logo}
              alt="KomikNesia"
              className="w-36 md:w-44 h-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-300 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/content')}
              className="text-gray-400 hover:text-gray-300 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              Daftar Komik
            </button>
            <button
              onClick={() => navigate('/library')}
              className="text-gray-400 hover:text-gray-300 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              Library
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="text-gray-400 hover:text-gray-300 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              Kontak Kami
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
              Copyright ©2026 Nusakomik, All Rights Reserved.
            </p>
          </div>

          <div className="text-center max-w-3xl">
            <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              Semua komik di website ini hanya preview dari komik aslinya, mungkin terdapat banyak kesalahan bahasa, nama tokoh, dan alur cerita. Untuk versi aslinya, silahkan beli komiknya jika tersedia di kotamu.
            </p>
          </div>

          {/* Histats.com — paling bawah */}
          <div className="flex flex-col items-center pt-2">
            <div id="histats_counter" className="min-h-[48px]" />
            <noscript>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <img src="//sstatic1.histats.com/0.gif?5027005&101" alt="" border={0} />
              </a>
            </noscript>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
