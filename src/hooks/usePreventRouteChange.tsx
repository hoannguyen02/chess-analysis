import { useRouter } from 'next/router';
import { useEffect } from 'react';

const usePreventRouteChange = (message: string, shouldWarn: boolean) => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      if (shouldWarn && !window.confirm(message)) {
        throw 'Route change aborted by user'; // Cancel the route change
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router, shouldWarn, message]);
};

export default usePreventRouteChange;
