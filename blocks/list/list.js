import {
  fetchIndex, fixExcelFilterZeroes, getLanguage, addPagingWidget, cropString,
} from '../../scripts/scripts.js';
import { getFormattedDate, fetchPlaceholders } from '../../scripts/lib-franklin.js';

const blockJson = {
  news: {
    filerResults: (data, currPath) => data.filter((entry) => entry.publisheddate
      && entry.path !== currPath
      && (entry.path.includes('/dentistry/news/')))
      .sort((x, y) => y.publisheddate - x.publisheddate),
    resultsPerPage: 12,
    titlePlaceHolderKey: 'news-page-title-text',
  },
};

export function getParams(params) {
  const curPage = new URLSearchParams(params).get('pg');
  return !curPage ? { curPage: 0 } : { curPage: parseInt(curPage, 10) };
}

function setResultValue(el, value) {
  el.innerText = cropString(value, 65);
}

async function getResults(page, block, blockType, placeholders) {
  const currPath = window.location.pathname;
  const sheet = `${getLanguage()}-search`;
  const json = await fetchIndex('query-index', sheet);
  fixExcelFilterZeroes(json.data);

  const { resultsPerPage, titlePlaceHolderKey } = blockJson[blockType];
  const startResult = page * resultsPerPage;
  const result = blockJson[blockType].filerResults(json.data, currPath);
  const div = document.createElement('div');
  const curPage = result.slice(startResult, startResult + resultsPerPage);

  curPage.forEach((line) => {
    const res = document.createElement('div');
    res.classList.add('result');
    const topLevelAnchor = document.createElement('a');
    const header = document.createElement('h3');
    const title = line.pagename || line.breadcrumbtitle || line.title;
    setResultValue(header, title);
    topLevelAnchor.href = line.path;
    const path = line.path || '';
    let childSpan;

    if (path) {
      const selfFiltered = json.data.filter((x) => x.path === path);

      if (selfFiltered && selfFiltered.length && selfFiltered[0].publisheddate) {
        childSpan = document.createElement('span');
        // eslint-disable-next-line max-len
        childSpan.textContent = getFormattedDate(new Date(Number(selfFiltered[0].publisheddate)), getLanguage());
      }
    }

    if (childSpan) {
      const p = document.createElement('p');
      p.classList.add('parent-detail');
      p.appendChild(childSpan);
      topLevelAnchor.appendChild(p);
    }

    topLevelAnchor.appendChild(header);
    const description = document.createElement('p');
    description.textContent = cropString(line.description, 65);
    topLevelAnchor.appendChild(description);

    res.appendChild(topLevelAnchor);
    div.appendChild(res);
  });

  const totalResults = result.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  addPagingWidget(div, page, totalPages);

  const title = placeholders[titlePlaceHolderKey];
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title;
    block.append(h2);
  }

  return div.children;
}

export default async function decorate(block, curLocation = window.location) {
  const { curPage } = getParams(curLocation.search);
  const blockType = Array.from(block.classList).filter((x) => ['list', 'block'].indexOf(x) === -1)[0];
  block.innerHTML = '';
  const placeholders = await fetchPlaceholders(getLanguage());
  const results = await getResults(curPage, block, blockType, placeholders);
  block.append(...results);
}
