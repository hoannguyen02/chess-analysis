import { NoPuzzleFound } from '@/components/NoPuzzleFound';
import SolvePuzzle from '@/components/SolvePuzzle';
import { TransitionContainer } from '@/components/TransitionContainer';
import { useAppContext } from '@/contexts/AppContext';
import { SolvedData } from '@/types/puzzle';
import axiosInstance from '@/utils/axiosInstance';
import { fetcher } from '@/utils/fetcher';
import isEmpty from 'lodash/isEmpty';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VscArrowLeft } from 'react-icons/vsc';
import useSWR from 'swr';

export const SolvePracticePuzzleScreen = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [nextPuzzleId, setNextPuzzleId] = useState(null);
  const { apiDomain, session } = useAppContext();
  const t = useTranslations();
  const router = useRouter();
  const { query } = router;

  const queryKey = useMemo(
    () => `${apiDomain}/v1/puzzles/public/${query.id}`,
    [apiDomain, query.id]
  );

  const {
    data: puzzle,
    isLoading,
    error,
  } = useSWR(queryKey, fetcher, {
    dedupingInterval: 300,
  });

  useEffect(() => {
    setIsVisible(false);
    if (puzzle) {
      setIsManualLoading(false);
      setIsVisible(true);
    } else {
      setIsManualLoading(false);
      setIsVisible(true);
    }
  }, [puzzle]);

  const handleNextClick = () => {
    setIsVisible(false);
    setIsManualLoading(true);
    if (nextPuzzleId === puzzle?._id) {
      console.log('Same puzzle ID detected, resetting manually...');
      setTimeout(() => {
        setIsManualLoading(false); // Manually reset loading state after delay
        setIsVisible(true);
        setRenderKey((prev) => prev + 1); // Trigger re-render after delay
      }, 500); // Delay of 500ms (adjust as needed)

      return;
    }
    router.push(`/practice-puzzles/${nextPuzzleId}`);
  };

  const handleSolvePuzzle = useCallback(
    async (data: SolvedData) => {
      if (!session?.id) {
        return;
      }
      setIsSubmitting(true);
      try {
        const { failedAttempts, timeTaken, usedHint } = data;
        let payload = {};

        const practicePuzzlePayload =
          sessionStorage.getItem('practice-puzzle-payload') || null;
        if (practicePuzzlePayload) {
          payload = JSON.parse(practicePuzzlePayload);
        }

        const submitResult = await axiosInstance.post(
          `${apiDomain}/v1/practice-puzzle/practice/next`,

          {
            userId: session?.id,
            puzzleId: puzzle._id,
            failedAttempts,
            timeTaken,
            usedHint,
            ...(!isEmpty(payload) && { filters: payload }),
          }
        );
        const nextId = submitResult.data;
        setNextPuzzleId(nextId);
      } catch (error) {
        console.log(error);
        setNextPuzzleId(null);
      } finally {
        setIsSubmitting(false);
      }
      setIsSubmitting(false);
    },
    [apiDomain, puzzle?._id, session?.id]
  );

  const showNextButton = useMemo(() => {
    return !isEmpty(nextPuzzleId);
  }, [nextPuzzleId]);

  return (
    <TransitionContainer
      key={query.id as string}
      isLoading={isLoading || isManualLoading}
      isVisible={isVisible}
    >
      {puzzle || !isEmpty(error) ? (
        <div className="flex flex-col">
          <button
            className="mb-4 flex items-center"
            onClick={() => {
              router.push('/practice-puzzles');
            }}
          >
            <VscArrowLeft /> {t('common.button.back')}
          </button>
          <SolvePuzzle
            key={renderKey}
            onSolved={handleSolvePuzzle}
            onNextClick={handleNextClick}
            puzzle={puzzle}
            showNextButton={showNextButton}
            showCloseButton={!showNextButton}
            onCloseClick={() => {
              router.push('/practice-puzzles');
            }}
          />
        </div>
      ) : (
        <NoPuzzleFound />
      )}
    </TransitionContainer>
  );
};
