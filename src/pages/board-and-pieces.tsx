import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { Button, Label } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/router';

const BoardAndPiecesPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const pieces: {
    name: 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
    text: string;
    num: number;
  }[] = [
    {
      name: 'K',
      text: t('board-pieces.king'),
      num: 1,
    },
    {
      name: 'Q',
      text: t('board-pieces.queen'),
      num: 1,
    },
    {
      name: 'R',
      text: t('board-pieces.rook'),
      num: 2,
    },
    {
      name: 'B',
      text: t('board-pieces.bishop'),
      num: 2,
    },
    {
      name: 'N',
      text: t('board-pieces.knight'),
      num: 2,
    },
    {
      name: 'P',
      text: t('board-pieces.pawn'),
      num: 8,
    },
  ];
  return (
    <Layout>
      <h1 className="font-bold text-[24px]">{t('board-pieces.title')}</h1>
      <p className="mt-4">{t('board-pieces.board-description')}</p>
      <p className="mt-4">{t('board-pieces.player-description')}</p>
      <div className="flex flex-col md:flex-row gap-10 mt-6 items-center">
        <div className="flex flex-col items-center ">
          <div className="flex flex-col">
            <div className="grid grid-cols-[1fr_100px_1fr] gap-4 text-center mb-4">
              <Label className="font-semibold">White</Label>
              <Label></Label>
              <Label className="font-semibold">Black</Label>
            </div>
            {pieces.map((p, index) => {
              return (
                <div
                  key={`${p.name}-${index}`}
                  className="grid grid-cols-[1fr_100px_1fr] gap-4 text-center items-center mb-2"
                >
                  <Image
                    alt={`LIMA Chess white piece - ${p.name}`}
                    width={30}
                    height={30}
                    className="mx-auto"
                    src={`/images/w${p.name}.png`}
                  />
                  <Label className="grid grid-cols-2 items-center justify-center">
                    <span className="text-center">{p.num}</span>
                    <span className="text-left">{p.text}</span>
                  </Label>
                  <Image
                    alt={`LIMA Chess black piece - ${p.name}`}
                    width={30}
                    height={30}
                    className="mx-auto"
                    src={`/images/b${p.name}.png`}
                  />
                </div>
              );
            })}
          </div>

          <Button
            id="learn-movement-and-capture-button"
            outline
            gradientDuoTone="cyanToBlue"
            size="lg"
            className="mt-4 px-6 py-3 text-lg transition-transform transform hover:scale-105"
            onClick={() => {
              window.dataLayer?.push({
                event: 'learn-movement-and-capture-button',
              });
              router.push(
                `/lessons/basic-about-chess-and-tactics/movement-and-capturing`
              );
            }}
          >
            {t('board-pieces.learn-moves')}
          </Button>
        </div>
        <div className="flex justify-center w-full">
          <Image
            src="/images/board-and-pieces.svg"
            alt="LIMA Chess - Board and pieces"
            width={400}
            height={400}
            className="rounded-lg shadow-md"
          />
        </div>
      </div>

      {/* Pieces like book */}
      {/* Capture board with start positions */}
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    try {
      const commonMessages = (await import(`@/locales/${locale}/common.json`))
        .default;

      const boardAndPieceMessages = (
        await import(`@/locales/${locale}/board-pieces.json`)
      ).default;

      return {
        props: {
          messages: {
            common: commonMessages,
            'board-pieces': boardAndPieceMessages,
          },
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        props: {},
      };
    }
  }
);

export default BoardAndPiecesPage;
