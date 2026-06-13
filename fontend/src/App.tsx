import { RouterProvider } from 'react-router';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { router } from '@/app/routes';
import { AuthProvider } from '@/app/context/AuthContext';
import { WebSocketProvider } from '@/app/context/WebSocketContext';

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
    <AuthProvider>
      <WebSocketProvider>
        <RouterProvider router={router} />
      </WebSocketProvider>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          classNames: {
            toast: 'rounded-xl shadow-lg border',
            title: 'btn-primary',
            description: 'text-sm',
            success: 'border-emerald-200 bg-white',
            error: 'border-red-200 bg-white',
            warning: 'border-amber-200 bg-white',
            info: 'border-blue-200 bg-white',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
