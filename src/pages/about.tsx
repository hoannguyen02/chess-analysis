import Layout from '@/components/Layout';
import fs from 'fs';
import matter from 'gray-matter';
import { GetStaticProps } from 'next';
import path from 'path';
import { remark } from 'remark';
import breaks from 'remark-breaks'; // Import the plugin
import html from 'remark-html';

interface AboutProps {
  content: string;
  title: string;
}

const About = ({ content, title }: AboutProps) => {
  return (
    <Layout>
      <h1 className="font-bold text-[24px]">{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  // Load the correct Markdown file based on the locale
  const filePath = path.join(process.cwd(), 'contents', `about.${locale}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  // Parse metadata and content
  const { data, content } = matter(fileContents);

  // Convert Markdown to HTML with remark-breaks for line breaks
  const processedContent = await remark()
    .use(breaks) // Use remark-breaks to convert single line breaks to <br>
    .use(html) // Convert Markdown to HTML
    .process(content);

  const contentHtml = processedContent.toString();

  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;

  return {
    props: {
      messages: { common: commonMessages },
      title: data.title,
      content: contentHtml,
    },
  };
};

export default About;
