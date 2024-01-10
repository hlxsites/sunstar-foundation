/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */

import { removeBreadCrumb, buildBlock, createSectionMetadata } from './utils.js';

/* eslint-disable no-console, class-methods-use-this */
const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const img = document.querySelector('[property="og:image"]');
  if (img && img.content) {
    const el = document.createElement('img');
    el.src = img.content;
    meta.Image = el;
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

function mapBrandsTop(document) {
  const brandsTop = document.querySelector('.brands-top > .brands-top-container');
  const mappedBrandsTop = document.createElement('div');
  if (brandsTop) {
    const topTitle = brandsTop.querySelector('.top-title');
    mappedBrandsTop.append(topTitle.cloneNode(true));

    const alter = brandsTop.querySelector('.alter');
    mappedBrandsTop.append(alter.cloneNode(true));

    const p = brandsTop.querySelector('p');
    mappedBrandsTop.append(p.cloneNode(true));
  }
  return mappedBrandsTop;
}

function mapOverviewTab(document) {
  const overviewTab = document.querySelector('#overview-tab');
  if (overviewTab) {
    const mappedOverviewTab = document.createElement('div');
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row');
    const cellDiv = document.createElement('div');
    cellDiv.classList.add('cell');
    rowDiv.append(cellDiv);
    const ul = document.createElement('ul');
    cellDiv.append(ul);
    overviewTab.querySelectorAll('a').forEach((a) => {
      const li = document.createElement('li');
      li.textContent = a.textContent;
      ul.append(li);
    });
    mappedOverviewTab.append(rowDiv);
    return mappedOverviewTab;
  }
  return null;
}

function importBrandsTop(document) {
  const brandsTop = document.querySelector('.brands-top');
  if (brandsTop) {
    const mappedBrandsTop = mapBrandsTop(document);
    const mappedOverviewTab = mapOverviewTab(document);
    let tocBlock;
    if (mappedOverviewTab) {
      tocBlock = buildBlock('TOC', ['flat'], mappedOverviewTab, document);
    }

    document.querySelector('.brands-top > .brands-top-container').remove();
    document.querySelector('.brands-top').append(mappedBrandsTop);
    const sectionMetadata = createSectionMetadata({ Style: 'Centered, Brands Top' }, document);
    mappedBrandsTop.after(sectionMetadata);
    const hr = document.createElement('hr');
    sectionMetadata.after(hr);
    if (tocBlock) {
      hr.after(tocBlock);
      tocBlock.after(hr.cloneNode(true));
    }
  }
}

function importBrandDescription(brandDescription, document) {
  const brandDescriptionContainer = brandDescription.querySelector(':scope > .brand-description-container');
  const mappedBrandDescription = document.createElement('div');
  const img = brandDescriptionContainer.querySelector(':scope > .brand-logo > img');
  mappedBrandDescription.append(img);
  mappedBrandDescription.append(brandDescriptionContainer.querySelector(':scope > h2.alter').cloneNode(true));
  mappedBrandDescription.append(brandDescriptionContainer.querySelector(':scope > h2.alter + figure > img').cloneNode(true));
  const detailsDiv = document.createElement('div');
  const row = document.createElement('div');
  row.classList.add('row');
  const cell = document.createElement('div');
  cell.classList.add('cell');
  row.append(cell);
  detailsDiv.append(row);
  cell.append(brandDescriptionContainer.querySelector(':scope > .details').cloneNode(true));
  const textBlock = buildBlock('Text', ['narrow'], detailsDiv, document);
  mappedBrandDescription.append(textBlock);
  mappedBrandDescription.append(createSectionMetadata({ Style: 'Brand Description' }, document));
  mappedBrandDescription.append(document.createElement('hr'));
  return mappedBrandDescription;
}

function importBrandDescriptions(document) {
  document.querySelectorAll('.brand-description').forEach((brandDescription) => {
    const mappedBrandDescription = importBrandDescription(brandDescription, document);
    brandDescription.replaceWith(mappedBrandDescription);
  });
}

function customImportLogic(document) {
  removeBreadCrumb(document);
  importBrandsTop(document);
  importBrandDescriptions(document);
}

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      'noscript',
      '.cookies-wrapper',
    ]);
    customImportLogic(document);
    // create the metadata block and append it to the main element
    createMetadata(main, document);

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
};
