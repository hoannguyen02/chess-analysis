import { useRouter } from 'next/router';

const NotFoundPage = () => {
  const router = useRouter();
  const isVi = router.locale === 'vi';
  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="flex flex-col items-center">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-lg mt-2">
          {isVi ? 'Không tìm thấy trang này.' : 'This page could not be found.'}
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
