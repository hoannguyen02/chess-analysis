import { useAppContext } from '@/contexts/AppContext';

export const NoPuzzleFound = () => {
  const { locale } = useAppContext();

  if (locale === 'vi') {
    return (
      <div>
        <h2>Không tìm thấy bài tập nào! Bạn có muốn:</h2>
        <ul className="mt-4 text-gray-700 text-lg space-y-2">
          <li> 🔄 Tải lại trang?</li>
          <li>🎯 Thử một bài tập khác?</li>
          <li>🏆 Xem một bài học mới?</li>
        </ul>
      </div>
    );
  }
  return (
    <div>
      <h2>No puzzles found! Would you like to:</h2>
      <ul className="mt-4 text-gray-700 text-lg space-y-2">
        <li>🔄 Reload the page?</li>
        <li>🎯 Try another puzzle?</li>
        <li>🏆 Explore a new lessons?</li>
      </ul>
    </div>
  );
};
