import { useAppContext } from '@/contexts/AppContext';
import { LessonExpanded } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { useEffect, useRef, useState } from 'react';

type Props = {
  data: LessonExpanded;
};

export const LessonDetailsScreenV2 = ({ data }: Props) => {
  const { locale } = useAppContext();
  const [activePuzzle, setActivePuzzle] = useState<Puzzle>();
  const menuRef = useRef<HTMLDivElement>(null); // Reference for sidebar scrolling

  useEffect(() => {
    if (data.contents?.length) {
      const puzzle = data.contents[5]?.contentPuzzles[0]; // Adjust index if needed
      setActivePuzzle(puzzle?.puzzleId as Puzzle);
    }
  }, [data]);

  useEffect(() => {
    if (activePuzzle) {
      // Scroll main content to the active puzzle
      const section = document.querySelector(
        `[data-section="${activePuzzle._id}"]`
      );
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Scroll sidebar menu to keep the active puzzle visible
      const activeItem = document.querySelector(
        `[data-menu-item="${activePuzzle._id}"]`
      );
      if (activeItem && menuRef.current) {
        menuRef.current.scrollTo({
          top:
            activeItem.getBoundingClientRect().top +
            menuRef.current.scrollTop -
            100, // Adjust offset
          behavior: 'smooth',
        });
      }
    }
  }, [activePuzzle]);

  if (!data.contents || data.contents.length === 0) return null;

  return (
    <div className="flex">
      {/* Sidebar with navigation */}
      <aside
        ref={menuRef}
        className="w-1/4 h-[calc(100vh-64px)] overflow-y-auto border-r bg-gray-50"
      >
        <ul className="mt-4 space-y-2">
          {data.contents.map((content) => (
            <li key={content._id} className="mb-2">
              <div className="sticky top-[50px] bg-white py-2 font-bold text-gray-700 z-10 p-4">
                {content.title[locale]}
              </div>

              <ul className="pl-4 text-sm">
                {content.contentPuzzles.map(({ puzzleId: puzzle }) => (
                  <li
                    key={puzzle._id}
                    data-menu-item={puzzle._id} // Identify menu item
                    className={`py-1 ${
                      activePuzzle?._id === puzzle._id
                        ? 'font-bold bg-blue-100 rounded'
                        : ''
                    }`}
                  >
                    <button
                      onClick={() => setActivePuzzle(puzzle)}
                      className="text-blue-500 hover:text-blue-700 transition w-full text-left p-2"
                    >
                      {puzzle?.title?.[locale]}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <main className="w-3/4 p-4"></main>
    </div>
  );
};
