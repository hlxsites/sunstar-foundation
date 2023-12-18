import { fetchPlaceholders, getMetadata } from '../../scripts/lib-franklin.js';
import buildNavTree from './nav-tree-utils.js';
import { getLanguage, decorateAnchors, htmlToElement } from '../../scripts/scripts.js';

/* Decorate the other items - which is the items pulled from top nav */
function decorateOtherItems(otherItemsEl) {
  otherItemsEl.classList.add('other-items');

  /* Pull items from the top nav */
  document.querySelector('nav.nav-top').querySelectorAll(':scope>ul>li').forEach((li) => {
    otherItemsEl.appendChild(li.cloneNode(true));
  });
}

function decorateTopNav(/* nav */) {
}

function decorateMiddleNav(nav) {
  const a = nav.querySelector('a');
  a.setAttribute('aria-label', 'Sunstar Home');
}

function getNavbarToggler() {
  const navbarToggl = htmlToElement(`<button class="navbar-toggler">
  <span class="mobile-icon">
    <i></i>
    <i></i>
    <i></i>
    <i></i>
  </span>
  </button>`);
  const widerScreenWidth = window.matchMedia('(min-width: 77rem)');
  if (!widerScreenWidth.matches) {
    navbarToggl.classList.add('visible');
  }
  navbarToggl.addEventListener('click', () => {
    const navBottom = document.querySelector('.nav-bottom');
    const header = document.querySelector('header');
    const { body } = document;
    if (navBottom.classList.contains('open')) {
      navBottom.classList.remove('open');
      header.classList.remove('menu-open');
      body.classList.remove('fixed');
    } else {
      navBottom.classList.add('open');
      header.classList.add('menu-open');
      body.classList.add('fixed');
    }
  });
  return navbarToggl;
}

function attachWindowResizeListeners(nav) {
  const header = document.querySelector('header');
  const { body } = document;
  const widerScreenWidth = window.matchMedia('(min-width: 77rem)');
  widerScreenWidth.addEventListener('change', (event) => {
    const toggler = nav.querySelector('.navbar-toggler');
    if (event.matches) {
      if (nav.classList.contains('open')) {
        nav.classList.remove('open');
        header.classList.remove('menu-open');
        body.classList.remove('fixed');
      }
      if (toggler.classList.contains('visible')) {
        toggler.classList.remove('visible');
      }
      const visibleMegaDrop = nav.querySelector('.mega-dropdown.visible');
      if (visibleMegaDrop) {
        visibleMegaDrop.classList.remove('visible');
      }
      const backButton = nav.querySelector('.menu-back-btn');
      if (backButton) {
        backButton.remove();
      }
    } else {
      toggler.classList.add('visible');
    }
  }, true);
}

function decorateBottomNav(nav, placeholders, navTreeJson) {
  const navTree = buildNavTree(navTreeJson);
  nav.append(getNavbarToggler());
  nav.append(navTree);

  const otherItemsEl = document.createElement('li');
  decorateOtherItems(otherItemsEl);
  nav.querySelector(':scope .menu-level-1').append(otherItemsEl);
  attachWindowResizeListeners(nav);
}

const navDecorators = { 'nav-top': decorateTopNav, 'nav-middle': decorateMiddleNav, 'nav-bottom': decorateBottomNav };
/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // fetch nav content
  const navMeta = getMetadata('nav');
  const navPath = navMeta || (getLanguage() === 'ja' ? '/nav' : `/${getLanguage()}/nav`);
  const resp = await fetch(`${navPath}.plain.html`);
  const navTreeResp = await fetch(`/nav-tree.json?sheet=${getLanguage()}`);
  const navTreeJson = await navTreeResp.json();
  if (resp.ok) {
    const placeholders = await fetchPlaceholders(getLanguage());
    block.innerHTML = '';
    const html = await resp.text();
    const fetchedNav = document.createElement('div');
    fetchedNav.innerHTML = html;
    const navClasses = ['nav-top', 'nav-middle'];
    navClasses.forEach((navClass, idx) => {
      const nav = document.createElement('nav');
      nav.classList.add(navClass);
      nav.innerHTML = fetchedNav.querySelectorAll(':scope>div')[idx].innerHTML;
      navDecorators[navClass](nav, placeholders);
      block.appendChild(nav);
    });
    const nav = document.createElement('nav');
    nav.classList.add('nav-bottom');
    navDecorators['nav-bottom'](nav, placeholders, navTreeJson);
    block.appendChild(nav);

    window.addEventListener('scroll', () => {
      if (document.documentElement.scrollTop > document.querySelector('nav.nav-top').offsetHeight + document.querySelector('nav.nav-middle').offsetHeight) {
        document.querySelector('header').classList.add('fixed');
      } else {
        document.querySelector('header').classList.remove('fixed');
      }
    });

    const backdrop = document.createElement('div');
    backdrop.classList.add('backdrop');
    document.body.appendChild(backdrop);

    decorateAnchors(block);
  }

  block.parentElement.classList.add('appear');
}
