/* eslint-disable no-unused-expressions */
/* global describe before it */

import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';

const scripts = {};

document.write(await readFile({ path: './columns.plain.html' }));

describe('Columns Block', () => {
  before(async () => {
    const mod = await import('../../../blocks/columns/columns.js');
    Object
      .keys(mod)
      .forEach((func) => {
        scripts[func] = mod[func];
      });
  });

  it('Handles split percentages', () => {
    const block = document.querySelector('.columns.split-80-20');

    scripts.applySplitPercentages(block);

    const ca = block.querySelector('#column-a');
    expect(ca.style.flexBasis).to.equal('80%');
    const cb = block.querySelector('#column-b');
    expect(cb.style.flexBasis).to.equal('20%');
    const cx = block.querySelector('#column-x');
    expect(cx.style.flexBasis).to.equal('80%');
    const cy = block.querySelector('#column-y');
    expect(cy.style.flexBasis).to.equal('20%');
  });

  it('No split percentages if not requested', () => {
    const block = document.querySelector('.columns.other');

    scripts.applySplitPercentages(block);

    const cc = block.querySelector('#column-c');
    expect(cc.style.flexBasis).to.equal('');
    const cd = block.querySelector('#column-d');
    expect(cd.style.flexBasis).to.equal('');
  });
});
