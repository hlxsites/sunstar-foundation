import {
  decorateButtons,
  decorateSections,
  getMetadata,
  updateSectionsStatus,
} from '../../scripts/lib-franklin.js';

import {
  getLanguage,
  decorateAnchors,
} from '../../scripts/scripts.js';

function decorateFooterTop(block, folder) {
  const footerTop = block.querySelector('.footer-top');
  const tempDiv = footerTop.querySelector('.section-container>div');
  const children = [...footerTop.querySelector('.section-container>div').children];
  let index = 0;
  tempDiv.innerHTML = '';

  while (index < children.length) {
    const topItem = document.createElement('div');
    topItem.classList.add('footer-top-item');
    topItem.appendChild(children[index]);
    index += 1;

    if (!folder) {
      while (index < children.length) {
        if (children[index].tagName === 'H5') {
          if (!children[index + 1] || (children[index - 1].tagName === 'H5' && children[index + 1].tagName !== 'UL')) {
            topItem.appendChild(children[index]);
          } else {
            break;
          }
        } else {
          topItem.appendChild(children[index]);
        }
        index += 1;
      }
    }

    tempDiv.appendChild(topItem);
  }
}

function decorateFooterSocialAddress(block) {
  const footerSocial = block.querySelector('.footer-social');
  if (footerSocial) {
    const table = footerSocial.querySelector('table');
    const footerSocialDefaultWrapper = footerSocial.querySelector('.footer-social>div>div');
    const childs = footerSocialDefaultWrapper.children;
    const ele = document.createElement('div');

    [...childs].forEach((x) => {
      if (x.tagName !== 'TABLE') {
        ele.appendChild(x);
      } else {
        const firstTr = x.querySelector('tr');
        const thead = document.createElement('thead');
        thead.appendChild(firstTr);
        table.prepend(thead);
      }
    });

    footerSocialDefaultWrapper.innerHTML = '';
    footerSocialDefaultWrapper.appendChild(table);
    footerSocialDefaultWrapper.appendChild(ele);
  }
}

function decorateFooter(block, folder) {
  decorateFooterTop(block, folder);
  decorateFooterSocialAddress(block);
  block.parentElement.classList.add('appear');
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.textContent = '';
  let footerPath = 0;
  let folder = 0;

  // fetch footer content
  const footerMeta = getMetadata('footer');
  folder = getMetadata('template');

  if (folder) {
    block.classList.add(folder);
    footerPath = footerMeta || (getLanguage() === 'jp' ? `/${folder}footer` : `/${getLanguage()}/{folder}footer`);
  } else {
    footerPath = footerMeta || (getLanguage() === 'jp' ? '/_drafts/piyush/footer' : '/_drafts/piyush/footer'); // todo change here before merge
  }

  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;
    decorateSections(footer);
    updateSectionsStatus(footer);
    block.append(footer);
    decorateButtons(block);
    decorateFooter(block, folder);
    decorateAnchors(block);
  }
}
