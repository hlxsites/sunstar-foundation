import {
  buildBlock, createOptimizedPicture, decorateBlock,
  getFormattedDate, getMetadata, loadBlock, readBlockConfig,
} from '../../scripts/lib-franklin.js';
import { queryIndex, getLanguage } from '../../scripts/scripts.js';

// Result parsers parse the query results into a format that can be used by the block builder for
// the specific block types
const resultParsers = {
  // Parse results into a highlight block

  highlight: (results, blockCfg, locale) => {
    const blockContents = [];
    results.forEach((result) => {
      const fields = blockCfg.fields.split(',').map((field) => field.trim().toLowerCase());
      const row = [];
      let cardImage;
      const cardBody = fields.includes('path') ? document.createElement('a') : document.createElement('div');
      fields.forEach((field) => {
        const fieldName = field.trim().toLowerCase();
        if (fieldName === 'path') {
          cardBody.href = result[fieldName];
        } else if (fieldName === 'image') {
          cardImage = createOptimizedPicture(result[fieldName]);
        } else {
          const div = document.createElement('div');
          if (fieldName === 'publisheddate') {
            div.classList.add('date');
            div.textContent = getFormattedDate(new Date(parseInt(result[fieldName], 10)));
          } else if (fieldName === 'title') {
            div.classList.add('title');
            div.textContent = result[fieldName];
          } else if (fieldName === 'description') {
            const firstJpLine = (locale === 'jp') ? result[fieldName].split('。')[0] : result[fieldName].split('. ')[0];
            div.textContent = firstJpLine;
          } else {
            div.textContent = result[fieldName];
          }
          cardBody.appendChild(div);
        }
      });
      if (cardImage) {
        const pathImg = document.createElement('a');
        pathImg.href = result.path;
        pathImg.append(cardImage);
        row.push(pathImg);
      }

      if (cardBody) {
        const path = document.createElement('a');
        path.href = result.path;
        cardBody.prepend(path);
        row.push(cardBody);
      }
      blockContents.push(row);
    });
    return blockContents;
  },
};

function getMetadataNullable(key) {
  const meta = getMetadata(key);
  return meta === '' ? null : meta;
}

// The below function is leveraged for View More button functionality
// eslint-disable-next-line
  async function loadMoreResults(block, blockType, results, blockCfg, loadMoreContainer, chunk, locale) {
  const currentResults = document.querySelectorAll('.other').length;
  const slicedResults = results.slice(currentResults, currentResults + chunk);
  const blockContents = resultParsers[blockType](slicedResults, blockCfg, locale);
  const builtBlock = buildBlock(blockType, blockContents);
  [...block.classList].forEach((item) => {
    if (item !== 'feed') {
      builtBlock.classList.add(item);
    }
  });

  builtBlock.querySelectorAll(':scope > div').forEach((div) => {
    div.classList.add('other');
  });
  const parentBlock = document.querySelector('.block.feed-newsroom > .others');
  parentBlock.append(...builtBlock.childNodes);
  if ((results.length - currentResults) > chunk) {
    parentBlock.append(loadMoreContainer);
  } else loadMoreContainer.remove();
}

// This is the default loading of the results
async function loadResults(block, blockType, results, blockCfg, chunk, locale) {
  let slicedResults = 0;
  let loadMoreContainer = 0;
  let currentResults = 0;
  if (results.length > chunk) {
    currentResults = document.querySelectorAll('.other').length;
    slicedResults = results.slice(currentResults, currentResults + chunk);
    loadMoreContainer = document.createElement('div');
    loadMoreContainer.innerHTML = '<button class="load-more-button">View more</button>';
    loadMoreContainer.classList.add('load-more-container');
    loadMoreContainer.addEventListener('click', () => {
      loadMoreResults(block, blockType, results, blockCfg, loadMoreContainer, chunk, locale);
    });
  } else slicedResults = results;
  const blockContents = resultParsers[blockType](slicedResults, blockCfg, locale);
  const builtBlock = buildBlock(blockType, blockContents);

  [...block.classList].forEach((item) => {
    if (item !== 'feed') {
      builtBlock.classList.add(item);
    }
  });

  if (block.parentNode) {
    block.parentNode.replaceChild(builtBlock, block);
  }

  decorateBlock(builtBlock);
  await loadBlock(builtBlock);

  if (results.length > currentResults) {
    const mobileMedia = window.matchMedia('(max-width: 992px)');
    if (mobileMedia.matches) {
      builtBlock.querySelector('.others').after(loadMoreContainer);
    } else builtBlock.after(loadMoreContainer);
  } else loadMoreContainer.remove();
  return builtBlock;
}

/**
     * Feed block decorator to build feeds based on block configuration
     */
export default async function decorate(block) {
  const chunk = 15;
  const blockType = 'highlight';
  const blockCfg = readBlockConfig(block);
  const locale = getLanguage();
  const queryObj = await queryIndex(`${getLanguage()}-search`);

  const omitPageTypes = getMetadataNullable('omit-page-types');
  // eslint-disable-next-line prefer-arrow-callback
  const results = queryObj.where(function filterElements(el) {
    const elPageType = (el.pagetype ?? '').trim().toLowerCase();
    let match = false;
    match = (!omitPageTypes || !(omitPageTypes.split(',').includes(elPageType)));
    return match;
  })
    // eslint-disable-next-line
      .orderByDescending((el) => (blockCfg.sort ? parseInt(el[blockCfg.sort.trim().toLowerCase()], 10) : el.path))
    .toList()
    .filter((x) => { const itsDate = getFormattedDate(new Date(parseInt(x[blockCfg.sort.trim().toLowerCase()], 10))).split(', '); return (parseInt(itsDate[itsDate.length - 1], 10) > 2000); });
  block.innerHTML = '';
  await loadResults(block, blockType, results, blockCfg, chunk, locale);
}
