import Layout from '@/components/Layout';
import { NoPuzzleFound } from '@/components/NoPuzzleFound';
import { RegisterDialog } from '@/components/RegisterDialog';
import { ShareFacebookButton } from '@/components/ShareFacebookButton';
import SolvePuzzle from '@/components/SolvePuzzle';
import { TransitionContainer } from '@/components/TransitionContainer';
import { DefaultLocale } from '@/constants';
import { useAppContext } from '@/contexts/AppContext';
import { withThemes } from '@/HOF/withThemes';
import useDialog from '@/hooks/useDialog';
import { SolvedData } from '@/types/puzzle';
import axiosInstance from '@/utils/axiosInstance';
import { fetcher } from '@/utils/fetcher';
import { Clipboard } from 'flowbite-react';
import isEmpty from 'lodash/isEmpty';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

const SolvePuzzlePage = () => {
  const [, setIsSubmitting] = useState(false);
  const { open, onOpenDialog, onCloseDialog } = useDialog();
  const [isVisible, setIsVisible] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [nextPuzzleId, setNextPuzzleId] = useState();
  const { apiDomain, session, getFilteredThemes } = useAppContext();
  const { excludedThemeIds } = getFilteredThemes();
  const t = useTranslations('common');
  const router = useRouter();
  const { locale, asPath, query } = router;
  const fullUrl = useMemo(
    () => `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}${asPath}`,
    [asPath, locale]
  );

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
      setIsVisible(true);
    }
  }, [puzzle]);

  const handleNextClick = () => {
    if (!session?.id) {
      window.dataLayer?.push({
        event: 'solve-puzzle-guest-next-button',
      });
      onOpenDialog();
      return;
    }
    setIsVisible(false);
    setIsManualLoading(true);
    router.push(`/solve-puzzles/${nextPuzzleId}`);
  };

  const handleSolvePuzzle = useCallback(
    async (data: SolvedData) => {
      if (!session?.id || isEmpty(puzzle)) {
        return;
      }
      setIsSubmitting(true);
      try {
        const { failedAttempts, timeTaken, usedHint } = data;

        const submitResult = await axiosInstance.post(
          `${apiDomain}/v1/solve-puzzle/solve/next`,

          {
            userId: session?.id,
            puzzleId: puzzle._id,
            failedAttempts,
            timeTaken,
            usedHint,
            excludedThemeIds,
          }
        );
        setNextPuzzleId(submitResult.data.nextPuzzleId);
      } catch (error) {
        console.log(error);
      } finally {
        setIsSubmitting(false);
      }
      setIsSubmitting(false);
    },
    [apiDomain, excludedThemeIds, puzzle, session?.id]
  );

  const isShowNextButton = useMemo(() => {
    return !isEmpty(nextPuzzleId) || isEmpty(session?.id);
  }, [nextPuzzleId, session?.id]);

  return (
    <Layout>
      <TransitionContainer
        key={query.id as string}
        isLoading={isLoading || isManualLoading}
        isVisible={isVisible}
      >
        {puzzle || !isEmpty(error) ? (
          <div className="flex flex-col">
            {puzzle.isPublic && (
              <div className="flex mb-6 justify-center">
                <ShareFacebookButton url={fullUrl} />
                <Clipboard
                  valueToCopy={fullUrl}
                  label={t('button.copy-link')}
                  className="ml-2"
                />
              </div>
            )}
            <SolvePuzzle
              onSolved={handleSolvePuzzle}
              onNextClick={handleNextClick}
              puzzle={puzzle}
              showNextButton={isShowNextButton}
              isPreview={false}
              showBookmark
            />
          </div>
        ) : (
          <NoPuzzleFound />
        )}
      </TransitionContainer>
      {open && <RegisterDialog onClose={onCloseDialog} />}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) => {
    const { locale } = ctx;
    // Helper function to load localization messages
    const loadMessages = async (locale: string) => {
      try {
        const commonMessages = (await import(`@/locales/${locale}/common.json`))
          .default;

        const solvePuzzleMessages = (
          await import(`@/locales/${locale}/solve-puzzle.json`)
        ).default;

        return {
          common: commonMessages,
          'solve-puzzle': solvePuzzleMessages,
        };
      } catch (err) {
        console.error('Localization loading error:', err);
        return {};
      }
    };

    // Initialize props
    const messages = await loadMessages(locale || DefaultLocale);

    try {
      return {
        props: {
          messages,
          error: null,
        },
      };
    } catch {
      return {
        props: {
          messages,
        },
      };
    }
  }
);

export default SolvePuzzlePage;
