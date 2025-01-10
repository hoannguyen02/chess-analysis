import Layout from '@/components/Layout';
import fs from 'fs';
import matter from 'gray-matter';
import { GetStaticProps } from 'next';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';

interface AboutProps {
  content: string;
  title: string;
}

const Contact = ({ content, title }: AboutProps) => {
  return (
    <Layout>
      <h1 className="font-bold text-[24px]">{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  // Load the correct Markdown file based on the locale
  const filePath = path.join(process.cwd(), 'contents', `contact.${locale}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  // Parse metadata and content
  const { data, content } = matter(fileContents);

  // Convert Markdown to HTML
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  const commonMessages = (await import(`@/locales/${locale}/common.json`))
    .default;

  return {
    props: {
      messages: { ...commonMessages },
      title: data.title,
      content: contentHtml,
    },
  };
};

export default Contact;
