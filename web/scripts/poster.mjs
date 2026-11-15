// The no-WebGL page's poster (ui/fallback.ts): the title shot the capture harness takes at device scale 2 (state
// `title-shot`: the scene alone), web-sized into public/: the landscape one at 1920 px wide, the portrait one (phones,
// width over height under .8) as captured, 780 × 1688. `npm run poster` runs both steps.
// The link preview's image (index.html og:image): the state `og`, the title at 1200 × 630 rendered at device scale 2,
// downsampled to 1200 × 630.
// shortcut: made by hand, so it lags the title's scene; rerun `npm run poster` after the title's look changes.
import sharp from 'sharp';

for (const [shot, file, width] of [['desktop/title-shot', 'poster.jpg', 1920], ['phone/title-shot', 'poster-tall.jpg', 780], ['og/og', 'og.jpg', 1200]]) {
  const out = await sharp(`captures/build/${shot}.png`).resize({ width, kernel: 'lanczos3' }).jpeg({ quality: 76, mozjpeg: true }).toFile(`public/${file}`);
  console.log(`public/${file}: ${out.width} × ${out.height}, ${(out.size / 1024).toFixed(0)} KB`);
}
