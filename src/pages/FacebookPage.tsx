import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Facebook, ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FACEBOOK_PAGE = 'https://www.facebook.com/6157322827524';

export function FacebookPage() {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Redirect to actual Facebook after a short delay
    const timer = setTimeout(() => {
      setIsRedirecting(true);
      window.location.href = FACEBOOK_PAGE;
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Facebook size={28} className="text-blue-600" />
              <span className="text-lg font-bold text-slate-900">almontaser</span>
            </div>
            <span className="text-sm text-slate-600">on Facebook</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">6</span>
            </div>
            <span className="text-sm text-slate-600">Grade Level</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-16 px-4">
          {/* Redirect Message */}
          {isRedirecting ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block"
              >
                <Facebook size={64} className="text-blue-600 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                Connecting to Facebook...
              </h2>
              <p className="text-slate-600">
                You'll be redirected to almontaser's Facebook page shortly.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Facebook size={48} className="text-white" />
                </div>
              </motion.div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                Visit almontaser on Facebook
              </h1>

              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Stay connected with almontaser through their official Facebook page. Get the latest updates, news, and insights about our educational platform.
              </p>

              <motion.button
                onClick={() => window.open(FACEBOOK_PAGE, '_blank')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink size={20} />
                  <span>Visit Facebook Page</span>
                </div>
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8"
              >
                <div className="text-center md:text-left">
                  <p className="text-sm text-slate-600 mb-2">
                    Page URL:
                  </p>
                  <code className="bg-slate-100 px-3 py-2 rounded-lg text-sm font-mono text-slate-700 break-all">
                    {FACEBOOK_PAGE}
                  </code>
                </div>

                <div className="text-center md:text-left">
                  <p className="text-sm text-slate-600 mb-2">
                    Platform Owner:
                  </p>
                  <p className="font-semibold text-slate-900">
                    almontaser
                  </p>
                </div>
              </motion.div>

              <div className="flex-1 border-t border-slate-200 pt-6 mt-8">
                <p className="text-sm text-slate-600 mb-2">
                  <ExternalLink size={16} className="inline-flex mr-2" />
                  Opens in new tab
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  <Facebook size={16} className="inline-flex mr-2" />
                  Official Facebook page of almontaser
                </p>
              </div>

              <motion.button
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Return to Dashboard
              </motion.button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
