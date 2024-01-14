import { getNamedValueFromTable } from '../../scripts/scripts.js';

function addEvent(menu, content) {
  menu.addEventListener('click', () => {
    content.classList.toggle('visible');
    menu.classList.toggle('visible');
  });
}

function buildUl(ul, block) {
  let textContent = '';
  block.querySelectorAll('ul li').forEach((li) => {
    if (li.querySelector('strong') !== null) {
      const aLink = li.querySelectorAll('a')[0];
      textContent = aLink.textContent;
      li.innerHTML = '';
      li.append(aLink);
      li.classList.add('active');
      ul.append(li);
    }
    ul.append(li);
  });
  return textContent;
}

function decorateTOC(block) {
  const menuTitle = getNamedValueFromTable(block, 'MobileMenuTitle');
  const content = getNamedValueFromTable(block, 'Content');
  const menuTitleTag = document.createElement('p');
  menuTitleTag.classList.add('toc-menu-title');
  menuTitleTag.textContent = menuTitle.textContent;
  addEvent(menuTitleTag, content);
  const ul = content.querySelector('ul');
  buildUl(ul, block);
  content.classList.add('toc-content');
  block.replaceChildren(menuTitleTag);
  block.append(content);
}

function buildTOCSide(block) {
  decorateTOC(block);
  block.closest('.section').classList.add('right-toc');
  const mainContent = document.createElement('div');
  mainContent.classList.add('main-content');
  const main = document.querySelector('main');
  [...main.querySelectorAll('.section')].forEach((section) => {
    section.dataset.sectionStatus = 'loaded';
    section.style.display = null;
    if (!section.classList.contains('breadcrumb-container')) {
      mainContent.append(section);
    }
  });
  const contentWrap = document.createElement('div');
  contentWrap.classList.add('content-wrap');
  const toc = mainContent.querySelector('.section.toc-container');
  contentWrap.append(toc);
  const contentInnercon = document.createElement('div');
  contentInnercon.classList.add('content-innercon');
  [...mainContent.querySelectorAll('.section.data-toc-section')].forEach((contentSection) => {
    contentInnercon.append(contentSection);
  });
  contentWrap.append(contentInnercon);
  mainContent.append(contentWrap);
  main.append(mainContent);
}

function buildTOCTop(ul, block) {
  block.parentElement.classList.add('flat');

  [...ul.querySelectorAll('li')].forEach((li) => {
    const liVar = li.innerText.toLowerCase();
    const aLink = document.createElement('a');
    aLink.href = `#${liVar}`;
    aLink.innerText = li.innerText;
    li.innerText = '';
    li.append(aLink);
  });
  [...document.querySelectorAll('[data-toc-anchor]')].forEach((section) => {
    const name = section.dataset.tocAnchor.toLowerCase().trim();
    section.id = name;
  });
}

export default async function decorate(block) {
  if (block.classList.contains('flat')) {
    const ul = block.querySelector('ul');
    if (ul) {
      block.replaceChildren(ul);
    }
    buildTOCTop(ul, block);
  } else {
    buildTOCSide(block);
  }
}
