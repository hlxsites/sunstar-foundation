export default function decorate(block) {
  if (block.classList.contains('highlight')) {
    const grandChildren = block.children[0].children;

    if (grandChildren.length) {
      block.innerHTML = '';
      [...grandChildren].forEach((grandChild, index) => {
        if (index === 0) {
          grandChild.classList.add('text-title');
        } else if (index === 1) {
          grandChild.classList.add('text-content');
        }
        block.appendChild(grandChild);
      });
    }
  }
}
