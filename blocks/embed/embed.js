/*
 * Embed Block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 */

import { loadScript } from '../../scripts/scripts.js';
import { loadCSS } from '../../scripts/lib-franklin.js';

const getDefaultEmbed = (url) => `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;

const embedYoutube = (url, isLite) => {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  let vid = usp.get('v');
  const autoplayParam = usp.get('autoplay');
  const mutedParam = usp.get('muted');

  if (autoplayParam && mutedParam) {
    suffix += `&autoplay=${autoplayParam}&muted=${mutedParam}`;
  } else if (autoplayParam) {
    suffix += `&autoplay=${autoplayParam}&muted=1`;
  } else if (mutedParam) {
    suffix += `&muted=${mutedParam}`;
  }

  let embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  let embedHTML;

  if (isLite) {
    const embedSplit = embed.split('/');
    embedHTML = `
      <lite-youtube videoid=${vid || embedSplit[embedSplit.length - 1]}>
        <a href="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" class="lty-playbtn" title="Play Video">
      </a>
      </lite-youtube>`;
    loadCSS(`${window.hlx.codeBasePath}/blocks/embed/lite-yt-embed.css`);
    loadScript(`${window.hlx.codeBasePath}/blocks/embed/lite-yt-embed.js`);
  } else {
    if (usp.get('list')) {
      // Special handling to support urls like "https://www.youtube.com/embed/videoseries?list=PL5uLvIsyvVSkGAGW3nW4pe3nfwQQRlMvD"
      embed += url.search;
    }
    embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
        <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
      </div>`;
  }

  return embedHTML;
};

/**
* Facebook, twitter social plugins embedding
* @param {*} urlParam
* @param {*} type
* @returns
*/
const embedSocialPlugins = (urlParam, isLite, type) => {
  const url = decodeURI(urlParam);
  const usp = new URLSearchParams(url);
  let width = usp.get('container_width') || usp.get('width') || '360px';
  let height = usp.get('height') || usp.get('maxHeight') || '598px';

  if (width.indexOf('px') === -1) {
    width += 'px';
  }
  if (height.indexOf('px') === -1) {
    height += 'px';
  }

  const embedHTML = `<div class='social-plugin ${type}' style="width:${width};">
    <iframe class='social-plugin-iframe' src=${url} loading="lazy" style="width:${width}; height:${height};"
      title="${type}:post ${type} Social Plugin" frameborder="0" allowtransparency="true" scrolling="no" allow="encrypted-media" allowfullscreen="true"></iframe>
  </div>`;

  return embedHTML;
};

/**
* Google Map embedding
* @param {*} urlParam
* @param {*} type
* @returns
*/
const embedGoogleMap = (urlParam, isLite, type) => {
  const url = decodeURI(urlParam);
  const embedHTML = `<div class="google-map">
    <iframe src=${url} loading="lazy" style="width: 100%; height: 600px; border: 0;"
      title="${type}:post ${type} Google Map Plugin" frameborder="0" allowfullscreen="true" loading="lazy"></iframe>
  </div>`;

  return embedHTML;
};

const loadEmbed = (block, grandChilds, link, existingClassList) => {
  if (block.classList.contains('embed-is-loaded')) {
    return;
  }

  const EMBEDS_CONFIG = [
    {
      match: ['youtube', 'youtu.be'],
      embed: embedYoutube,
    },
    {
      match: ['google'],
      embed: embedGoogleMap,
      type: 'google',
    },
    {
      match: ['facebook', 'fb'],
      embed: embedSocialPlugins,
      type: 'facebook',
    },
    {
      match: ['twitter'],
      embed: embedSocialPlugins,
      type: 'twitter',
    },
    {
      match: ['instagram'],
      embed: embedSocialPlugins,
      type: 'instagram',
    },
  ];
  const url = new URL(link);
  const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => url.hostname.includes(match)));

  const isLite = block.classList.contains('lite');

  if (config) {
    block.innerHTML = config.embed(url, isLite, config.type);
    block.classList = `block embed embed-${config.match[0]}`;
  } else {
    block.innerHTML = getDefaultEmbed(url);
    // Pass the video config to the iframe
    const videoConfig = {
      autoplay: 'any',
    };
    window.addEventListener('message', (event) => {
      switch (event.data) {
        case 'config':
        case 'video-config':
          event.source.window.postMessage(JSON.stringify(videoConfig), '*');
          break;
        default:
          break;
      }
    });
    block.classList = 'block embed';
  }
  block.classList.add('embed-is-loaded');
  if (existingClassList) {
    existingClassList.forEach((element) => {
      block.classList.add(element);
    });
  }

  if (grandChilds.length === 2) {
    // This handles video with caption
    const captionDiv = grandChilds[1];
    captionDiv.classList.add('caption');
    block.appendChild(captionDiv);
  }
};

export default function decorate(block) {
  const link = block.querySelector('a').href;
  const childDiv = block.querySelector('div');
  const grandChilds = childDiv ? childDiv.querySelectorAll('div') : [];
  const placeholder = block.querySelector('picture');
  const existingClassList = block.classList;
  block.textContent = '';

  if (placeholder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'embed-placeholder';
    wrapper.innerHTML = '<div class="embed-placeholder-play"><button type="button" title="Play"></button></div>';
    wrapper.prepend(placeholder);
    wrapper.addEventListener('click', () => {
      loadEmbed(block, grandChilds, link);
    });
    block.append(wrapper);
  } else if (block.closest('body')) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadEmbed(block, grandChilds, link, [...existingClassList]);
      }
    });
    observer.observe(block);
  } else {
    loadEmbed(block, grandChilds, link, [...existingClassList]);
  }
}
