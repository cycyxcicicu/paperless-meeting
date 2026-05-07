import { RouterProvider } from 'react-router';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { router } from './routes';

function App() {
  useEffect(() => {
    // Suppress react-quill findDOMNode deprecation warning
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('findDOMNode is deprecated')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          classNames: {
            toast: 'rounded-xl shadow-lg border',
            title: 'font-semibold',
            description: 'text-sm',
            success: 'border-emerald-200 bg-white',
            error: 'border-red-200 bg-white',
            warning: 'border-amber-200 bg-white',
            info: 'border-blue-200 bg-white',
          },
        }}
      />
    </>
  );
}

export default App;
