// Every variant of the mark comes from logo.svg, so the final logo is a one-file swap: the inline sprite (#mark, used
// by the top bar, title lockup, credits footer and info sheet), the favicon, and the image the footer art dithers.
import raw from './logo.svg?raw';

const svg = new DOMParser().parseFromString(raw, 'image/svg+xml').documentElement;
const sized = (px: number) => {
  const s = svg.cloneNode(true) as Element;
  s.setAttribute('width', `${px}`); s.setAttribute('height', `${px}`);   // Firefox draws no SVG image without a size
  return new XMLSerializer().serializeToString(s);
};
const dataUrl = (xml: string) => `data:image/svg+xml,${encodeURIComponent(xml)}`;

// Sprite: the file's shapes without its root, so currentColor follows each placement's CSS colour.
const mark = document.getElementById('mark')!;
mark.setAttribute('viewBox', svg.getAttribute('viewBox') ?? '0 0 48 48');
mark.replaceChildren(...Array.from(svg.children, n => document.importNode(n, true)));

// Favicon: the mark on the stage colour, so its light parts still read on a light tab strip.
document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href = dataUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="#06070A"/>${sized(48)}</svg>`);

export const logoImg = new Image();
logoImg.src = dataUrl(sized(256));
