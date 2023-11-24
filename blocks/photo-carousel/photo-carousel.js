let curvisiblePhoto;
function setCurImage(count, total, slides, counter) {
  const rect = slides.getBoundingClientRect();
  slides.scroll(count * rect.width, slides.scrollHeight);

  counter.innerText = `${count + 1} / ${total}`;
  curvisiblePhoto = count;
}

function scrollNext(fwd, numImages, slides, counter) {
  let nextImage = fwd ? curvisiblePhoto + 1 : curvisiblePhoto - 1;
  if (nextImage >= numImages) {
    nextImage = 0;
  } else if (nextImage < 0) {
    nextImage = numImages - 1;
  }
  setCurImage(nextImage, numImages, slides, counter);
}

export default async function decorate(block) {
  const counter = document.createElement('p');
  counter.classList.add('counter');

  const slider = document.createElement('div');
  slider.classList.add('photo-carousel', 'photo-slider');

  const left = document.createElement('img');
  left.classList.add('photo-button');
  left.classList.add('photo-button-left');
  left.src = '/icons/angle-left-blue.svg';
  slider.append(left);

  const slides = document.createElement('div');
  slides.classList.add('photo-slides');
  slider.append(slides);

  const imgSelection = block.querySelectorAll('img');
  const numImages = imgSelection.length;
  imgSelection.forEach((img) => {
    slides.append(img);
  });

  const right = document.createElement('img');
  right.classList.add('photo-button');
  right.classList.add('photo-button-right');
  right.src = '/icons/angle-right-blue.svg';
  slider.append(right);

  block.replaceWith(slider);

  left.onclick = () => scrollNext(false, numImages, slides, counter);
  right.onclick = () => scrollNext(true, numImages, slides, counter);
  setCurImage(0, numImages, slides, counter);

  slider.insertAdjacentElement('afterend', counter);
}
