import {
  buildBlock, createOptimizedPicture, decorateBlock,
  getFormattedDate, getMetadata, loadBlock, readBlockConfig, fetchPlaceholders,
} from '../../scripts/lib-franklin.js';
import { queryIndex, getLanguage } from '../../scripts/scripts.js';

// Result parsers parse the query results into a format that can be used by the block builder for
// the specific block types
const resultParsers = {
  // Parse results into a cards block
  cards: (results, blockCfg) => {
    const blockContents = [];
    results.forEach((result) => {
      const fields = blockCfg.fields.split(',');
      const row = [];
      let cardImage;
      const cardBody = document.createElement('div');
      fields.forEach((field) => {
        const fieldName = field.trim().toLowerCase();
        if (fieldName === 'image') {
          cardImage = createOptimizedPicture(result[fieldName]);
        } else {
          const div = document.createElement('div');
          if (fieldName === 'publisheddate') {
            div.classList.add('date');
            div.textContent = getFormattedDate(new Date(parseInt(result[fieldName], 10)));
          } else if (fieldName === 'title') {
            div.classList.add('title');
            div.textContent = result[fieldName];
          } else {
            div.textContent = result[fieldName];
          }
          cardBody.appendChild(div);
        }
      });
      if (cardImage) {
        row.push(cardImage);
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

  highlight: (results, blockCfg, block = '') => {
    const blockContents = [];
    results.forEach(async (result) => {
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
          } else {
            div.textContent = result[fieldName];
          }
          cardBody.appendChild(div);
        }
      });
      if (cardImage) {
        if (result.path) {
          const pathImg = document.createElement('a');
          pathImg.href = result.path;
          pathImg.append(cardImage);
          row.push(pathImg);
        } else {
          row.push(cardImage);
        }
      }
      if (result.featured === 'true' && block.classList.contains('featured')) {
        const locale = (getLanguage(
          window.location.pathname,
          false,
        ));
        const placeholders = await fetchPlaceholders(locale);
        const featuredInnerText = placeholders.featured;
        const divFeatured = document.createElement('div');
        divFeatured.innerHTML = `<h5>${featuredInnerText}</h5>`;
        cardBody.insertBefore(divFeatured, cardBody.firstChild);
      }

      if (cardBody) {
        const path = document.createElement('a');
        path.href = result.path;
        path.append(cardBody);
        row.push(path);
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

/**
 * Feed block decorator to build feeds based on block configuration
 */
export default async function decorate(block) {
  let blockContents = 0;
  let queryObj = 0;

  const blockCfg = readBlockConfig(block);
  const blockName = (blockCfg['block-type'] ?? 'cards').trim().toLowerCase();
  const blockType = (blockName.split('(')[0]).trim();
  const variation = (blockName.match(/\((.+)\)/) === null ? '' : blockName.match(/\((.+)\)/)[1]).trim();
  queryObj = await queryIndex(`${getLanguage()}-search`);

  // Get the query string, which includes the leading "?" character
  const queryString = window.location.search;

  // Parse the query string into an object
  const queryParams = new URLSearchParams(queryString);

  const type = (blockCfg.type ?? getMetadataNullable('type') ?? queryParams.get('feed-type'))?.trim().toLowerCase();
  const category = (blockCfg.category ?? getMetadataNullable('category' ?? queryParams.get('feed-category')))?.trim().toLowerCase();
  const tags = (blockCfg.tags ?? getMetadataNullable('tags') ?? queryParams.get('feed-tags'))?.trim().toLowerCase();
  const omitPageTypes = (blockCfg['omit-page-types'] ?? getMetadataNullable('omit-page-types')
    ?? queryParams.get('feed-omit-page-types'))?.trim().toLowerCase();
  // eslint-disable-next-line prefer-arrow-callback
  const results = queryObj.where(function filterElements(el) {
    const elType = (el.type ?? '').trim().toLowerCase();
    const elCategory = (el.category ?? '').trim().toLowerCase();
    const elFeatured = (el.featured ?? '').trim().toLowerCase();
    const elPageType = (el.pagetype ?? '').trim().toLowerCase();
    let match = false;
    match = (!type || type === elType)
      && (!category || category === elCategory)
      && (!omitPageTypes || !(omitPageTypes.split(',').includes(elPageType)))
      && (!blockCfg.featured || elFeatured === blockCfg.featured.trim().toLowerCase());
    if (match && tags) {
      const tagList = tags.split(',');
      const elTags = JSON.parse(el.tags ?? '').map((tag) => tag.trim().toLowerCase());
      match = tagList.some((tag) => elTags.includes(tag.trim()));
    }
    return match;
  })
    .orderByDescending((el) => (blockCfg.sort ? el[blockCfg.sort.trim().toLowerCase()] : el.path))
    .take(blockCfg.count ? parseInt(blockCfg.count, 10) : 4)
    .toList();
  block.innerHTML = '';
  if (block.classList.contains('featured')) {
    // const locale = (getLanguage(
    //   window.location.pathname,
    //   false,
    // ));
    // const placeholders = await fetchPlaceholders(locale);
    // const featuredInnerText = placeholders.featured;
    blockContents = await resultParsers[blockType](results, blockCfg, block);
  } else blockContents = resultParsers[blockType](results, blockCfg);
  const builtBlock = buildBlock(blockType, blockContents);

  [...block.classList].forEach((item) => {
    if (item !== 'feed') {
      builtBlock.classList.add(item);
    }
  });

  if (variation) {
    builtBlock.classList.add(variation);
  }

  if (block.parentNode) {
    block.parentNode.replaceChild(builtBlock, block);
  }

  decorateBlock(builtBlock);
  await loadBlock(builtBlock);
  return builtBlock;
}
