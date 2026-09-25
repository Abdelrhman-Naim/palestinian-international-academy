import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isEn = typeof window !== 'undefined' && localStorage.getItem('lang') === 'en';
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-gray-900 p-6 font-cairo" dir={isEn ? 'ltr' : 'rtl'}>
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-[#E8E2D5] dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isEn ? 'An Unexpected Error Occurred' : 'حدث خطأ غير متوقع'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {isEn 
                ? 'We apologize for this inconvenience. You can retry or return to the homepage.' 
                : 'نعتذر عن هذا الخطأ. يمكنك إعادة تحميل الصفحة أو العودة إلى الصفحة الرئيسية.'}
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-start text-xs font-mono text-red-600 dark:text-red-400 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-primary text-white font-bold py-2.5 px-4 rounded-xl hover:bg-amber-600 transition-colors shadow-sm text-sm cursor-pointer"
              >
                {isEn ? 'Retry' : 'إعادة المحاولة'}
              </button>
              <a
                href="/"
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center text-sm"
              >
                {isEn ? 'Home' : 'الصفحة الرئيسية'}
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
