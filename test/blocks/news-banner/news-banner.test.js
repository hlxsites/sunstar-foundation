/* eslint-disable no-unused-expressions */
/* global describe before it */

import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import sinon from 'sinon';

const scripts = {};

document.write(await readFile({ path: './news-banner.plain.html' }));

describe('News Block', () => {
  before(async () => {
    const mod = await import('../../../blocks/news-banner/news-banner.js');
    Object
      .keys(mod)
      .forEach((func) => {
        scripts[func] = mod[func];
      });
  });

  it('Initial news article', async () => {
    const placeholders = {
      newstext: 'News',
    };
    window.placeholders = {
      'translation-loaded': {},
      translation: {
        jp: placeholders,
      },
    };

    const queryIndex = '/query-index.json';
    const mf = sinon.stub(window, 'fetch');
    mf.callsFake((v) => {
      if (v.startsWith(queryIndex)) {
        return {
          ok: true,
          json: () => ({
            data: [
              { path: '/news/a/', title: 'a text', lastModified: 1685443971 },
            ],
          }),
        };
      }

      return {
        ok: false, json: () => ({ data: [] }), text: () => '',
      };
    });

    const block = document.querySelector('.news-banner');
    try {
      await scripts.default(block); // The decorate method is the default one
    } finally {
      mf.restore();
      window.index = {}; // Reset cache
    }

    const spans = block.querySelectorAll('span');
    expect(spans[0].innerText).to.equal('News');
    expect(spans[1].innerText).to.equal('');
  });
});
