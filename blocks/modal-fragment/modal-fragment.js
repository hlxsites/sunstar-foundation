import {
  handleModalClick,
  MODAL_FRAGMENTS_ANCHOR_SELECTOR,
} from '../../scripts/scripts.js';

function getModalId(path) {
  const segments = path.split('/');
  return `#${segments.pop()}-modal`;
}

export default async function decorate(block) {
  document.querySelectorAll(MODAL_FRAGMENTS_ANCHOR_SELECTOR).forEach((a) => {
    const path = new URL(a.href).pathname;
    a.dataset.path = path;
    const modalId = getModalId(path);
    a.dataset.modal = modalId;
    const url = a.href;
    a.href = '#';
    a.dataset.url = url;
    if (path.includes('videos')) {
      a.classList.add('video-link');
    }
    const hasSearchParam = new URL(url).search.length > 0;
    a.dataset.hasSearchParam = hasSearchParam.toString();
    handleModalClick(a, block);
  });
}
