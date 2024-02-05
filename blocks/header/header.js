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

function decorateBottomRightNav() {
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
    const navBottomRight = document.querySelector('.nav-bottom-right');
    const header = document.querySelector('header');
    const { body } = document;
    if (navBottom.classList.contains('open')) {
      navBottom.classList.remove('open');
      header.classList.remove('menu-open');
      body.classList.remove('fixed');
      navBottomRight.classList.remove('fixed');
    } else {
      navBottom.classList.add('open');
      header.classList.add('menu-open');
      body.classList.add('fixed');
      navBottomRight.classList.add('fixed');
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
  let folder = 0;
  folder = getMetadata('template');
  nav.append(getNavbarToggler());
  nav.append(navTree);
  if (!folder) {
    const otherItemsEl = document.createElement('li');
    decorateOtherItems(otherItemsEl);
    nav.querySelector(':scope .menu-level-1').append(otherItemsEl);
  }
  attachWindowResizeListeners(nav);
}

const navDecorators = {
  'nav-top': decorateTopNav, 'nav-middle': decorateMiddleNav, 'nav-bottom-right': decorateBottomRightNav, 'nav-bottom': decorateBottomNav,
};
/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  let navPath = 0;
  let folder = 0;
  let navTreeResp = 0;

  // fetch nav content
  const navMeta = getMetadata('nav');
  folder = getMetadata('template');
  if (folder) {
    navPath = navMeta || (getLanguage() === 'jp' ? `/${folder}nav` : `/${getLanguage()}/${folder}nav`);
    navTreeResp = await fetch(`/${folder}nav-tree.json?sheet=${getLanguage()}`);
  } else {
    navPath = navMeta || (getLanguage() === 'jp' ? '/nav' : `/${getLanguage()}/nav`);
    navTreeResp = await fetch(`/nav-tree.json?sheet=${getLanguage()}`);
  }

  const resp = await fetch(`${navPath}.plain.html`);
  const navTreeJson = await navTreeResp.json();
  if (resp.ok) {
    const placeholders = await fetchPlaceholders(getLanguage());
    block.innerHTML = '';
    const html = await resp.text();
    const fetchedNav = document.createElement('div');
    fetchedNav.innerHTML = html;

    const navClasses = ['nav-top', 'nav-middle'];

    let idxcounter = 0;
    navClasses.forEach((navClass, idx) => {
      const nav = document.createElement('nav');
      nav.classList.add(navClass);
      nav.innerHTML = fetchedNav.querySelectorAll(':scope>div')[idx].innerHTML;
      navDecorators[navClass](nav, placeholders);
      idxcounter = idx;
      block.appendChild(nav);
    });
    if (folder) {
      const bottomnav = document.createElement('nav');
      bottomnav.classList.add('nav-bottom-parent');
      const nav = document.createElement('nav');
      nav.classList.add('nav-bottom');
      navDecorators['nav-bottom'](nav, placeholders, navTreeJson);
      bottomnav.appendChild(nav);
      const nav1 = document.createElement('nav');
      nav1.classList.add('nav-bottom-right');
      nav1.innerHTML += fetchedNav.querySelectorAll(':scope>div')[idxcounter + 1].innerHTML;
      bottomnav.appendChild(nav1);
      block.appendChild(bottomnav);
    } else {
      const nav = document.createElement('nav');
      nav.classList.add('nav-bottom');
      navDecorators['nav-bottom'](nav, placeholders, navTreeJson);
      block.appendChild(nav);
    }

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
