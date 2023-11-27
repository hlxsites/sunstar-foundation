/* eslint-disable no-unused-expressions */
/* global describe before it */

import { expect } from '@esm-bundle/chai';

const functions = {};

describe('Photo Carousel', () => {
  before(async () => {
    const mod = await import('../../../blocks/photo-carousel/photo-carousel.js');
    Object
      .keys(mod)
      .forEach((func) => {
        functions[func] = mod[func];
      });
  });

  it('Sets the correct image', () => {
    let scrollx;
    let scrolly;
    const slides = {};
    slides.getBoundingClientRect = () => ({ width: 123 });
    slides.scrollHeight = 400;
    slides.scroll = (x, y) => {
      scrollx = x;
      scrolly = y;
    };

    const counter = {};

    functions.setCurImage(3, 5, slides, counter);
    expect(scrollx).to.equal(3 * 123);
    expect(scrolly).to.equal(400);
    expect(counter.innerText).to.equal('4 / 5');

    functions.scrollNext(true, 5, slides, counter);
    expect(scrollx).to.equal(4 * 123);
    expect(scrolly).to.equal(400);
    expect(counter.innerText).to.equal('5 / 5');

    functions.scrollNext(true, 5, slides, counter);
    expect(scrollx).to.equal(0);
    expect(scrolly).to.equal(400);
    expect(counter.innerText).to.equal('1 / 5');

    functions.scrollNext(false, 5, slides, counter);
    expect(scrollx).to.equal(4 * 123);
    expect(scrolly).to.equal(400);
    expect(counter.innerText).to.equal('5 / 5');
  });
});
