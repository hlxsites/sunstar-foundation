import { getLanguage, queryIndex, fixExcelFilterZeroes } from '../../scripts/scripts.js';
import { fetchPlaceholders, getFormattedDate } from '../../scripts/lib-franklin.js';

function setNewsBanner(block, text, path, title, lm) {
  let date;
  if (lm) {
    date = getFormattedDate(new Date(Number(lm)), getLanguage());
  } else {
    date = '';
  }

  const newsHTML = `<span>${text}</span> <span>${date}</span>
    <a href="${path}">${title}</a>`;
  block.innerHTML = newsHTML;
}

export async function setLatestNewsArticle(block, placeholders) {
  const queryObj = await queryIndex(`${getLanguage()}-search`);

  const result = queryObj.where((el) => (el.path.includes('/newsroom/') || el.path.includes('/news/')) && el.publisheddate !== '0')
    .orderByDescending((el) => el.publisheddate)
    .toList();
  fixExcelFilterZeroes(result);

  if (!result.length) {
    return;
  }

  const article = result[0];
  const newsTitle = article.pagename || article.breadcrumbtitle || article.title;
  const newsBannerHeadingText = placeholders[article.category] || placeholders.newstext;

  setNewsBanner(block, newsBannerHeadingText, article.path, newsTitle, article.publisheddate);
}

export default async function decorate(block) {
  const lang = getLanguage();
  const placeholders = await fetchPlaceholders(lang);

  // Initialize the news banner with empty content
  setNewsBanner(block, placeholders.newstext, '', '', undefined);

  // Update it with the news article asynchronously
  setLatestNewsArticle(block, placeholders);
}
