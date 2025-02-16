import { useAppContext } from '@/contexts/AppContext';
import { ContentLesson } from '@/types/lesson';
import { Puzzle } from '@/types/puzzle';
import { Tooltip } from 'flowbite-react';
import { VscCheck } from 'react-icons/vsc';

type Props = {
  title: string;
  onItemClick(contentIdx: number, puzzle: Puzzle, explanations: string[]): void;
  completedPuzzleMap: Map<string, boolean>;
  completedProgress: number;
  circumference: number;
  strokeDashoffset: number;
  contents: ContentLesson[] | undefined;
  activePuzzleId?: string;
  description?: string;
};
export const MenuLesson = ({
  title,
  completedProgress,
  circumference,
  strokeDashoffset,
  completedPuzzleMap,
  contents,
  activePuzzleId,
  description,
  onItemClick,
}: Props) => {
  const { locale } = useAppContext();
  return (
    <>
      <div className="sticky top-0 z-20 border-b bg-white flex items-center justify-between p-4">
        {description ? (
          <Tooltip content={description} placement="bottom">
            <h3>{title}</h3>
          </Tooltip>
        ) : (
          <h3>{title}</h3>
        )}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            {/* Background Circle */}
            <circle
              className="text-[#D6D6D6]"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              r="15"
              cx="18"
              cy="18"
            />

            {/* Progress Circle */}
            <circle
              className="text-[#007BFF] transition-all duration-300"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              r="15"
              cx="18"
              cy="18"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 18 18)" // Rotates progress to start from the top
            />

            {/* Text in the center */}
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              className="text-[#2D3748] text-[10px] font-bold"
            >
              {completedProgress}%
            </text>
          </svg>
        </div>
      </div>
      <ul className="space-y-2">
        {contents?.map((content, index) => (
          <li key={content._id} className="mb-2">
            <div className="sticky border-b flex justify-between items-center top-[70px] bg-white py-2 font-bold text-gray-700 z-10 p-4">
              {`${index + 1}.`} {content.title[locale]}
            </div>

            <ul className="pl-0 text-sm">
              {content.contentPuzzles.map(({ puzzleId: puzzle }) => (
                <li
                  key={puzzle._id}
                  data-menu-item={puzzle._id} // Identify menu item
                  className={`${
                    activePuzzleId === puzzle._id
                      ? 'font-bold bg-blue-100 '
                      : ''
                  } hover:bg-blue-100`}
                >
                  <button
                    onClick={() => {
                      onItemClick(
                        index,
                        puzzle,
                        content?.explanations?.[locale] || []
                      );
                    }}
                    className="text-blue-500 hover:text-blue-700 transition w-full text-left px-4 py-2 flex justify-between"
                  >
                    {puzzle?.title?.[locale]}
                    {completedPuzzleMap.get(puzzle._id!) && (
                      <VscCheck className="text-[#28A745]" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
};
