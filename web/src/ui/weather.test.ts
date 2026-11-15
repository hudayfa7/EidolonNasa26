// The weather window's words: a day for screen readers, a purpose's limits, the source line.
import { describe, expect, it } from 'vitest';
import { barH, dayText, isGo, lc, limitsText, marks, noMonths, srcText } from './weather';

const d = { iso: '2026-10-06', wind: 10.69, rain: 0.6, hi: 14.2, lo: -1.4 };
describe('the weather window\'s words', () => {
  it('a day: its weather, then the limits it goes over', () => {
    expect(dayText(d, [], 'forecast')).toBe('Tue 6 Oct: wind 10.7 m/s, rain 0.6 mm, −1.4 to 14.2 °C; under the limits');
    expect(dayText(d, ['wind'], 'forecast')).toBe('Tue 6 Oct: wind 10.7 m/s, rain 0.6 mm, −1.4 to 14.2 °C; over the wind limit');
    expect(dayText(d, ['wind', 'rain', 'cold'], 'sample')).toMatch(/over the wind, rain and cold limits$/);
    expect(dayText({ ...d, rain: NaN }, ['rain'], 'forecast')).toBe('Tue 6 Oct: no forecast for this day');
    expect(dayText(d, [], 'loading')).toBe('Tue 6 Oct: forecast loading');
  });
  it('a go only once the weather is known; bars by the strongest wind, capped', () => {
    expect([isGo([], 'forecast'), isGo([], 'loading'), isGo(['heat'], 'sample')]).toEqual([true, false, false]);
    expect([barH(d), barH({ ...d, wind: 30 }), barH({ ...d, wind: NaN })]).toEqual(['0.59', '1.00', '0']);
  });
  it('a dot where rain or temperature goes over (the bar shows the wind), only once the weather is known', () => {
    expect([marks(d, [], 'forecast'), marks(d, ['wind'], 'forecast'), marks(d, ['rain'], 'forecast'), marks(d, ['wind', 'cold'], 'sample')]).toEqual([' go', '', ' dot', ' dot']);
    expect([marks(d, ['heat'], 'loading'), marks({ ...d, rain: NaN }, ['rain'], 'forecast')]).toEqual(['', '']);
  });
  it('the limits, the purpose in a sentence, the source', () => {
    expect(limitsText('eva_training')).toBe('wind under 9&nbsp;m/s, rain up to 1&nbsp;mm, −10 to 32&nbsp;°C');
    expect(limitsText('education')).toBe('wind under 9&nbsp;m/s, rain up to 1&nbsp;mm, 0 to 32&nbsp;°C');
    expect([lc('Rover mobility'), lc('EVA training')]).toEqual(['rover mobility', 'EVA training']);
    expect(srcText('forecast')).toBe('Forecast: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>).');
    expect(noMonths('EVA training')).toBe('No month’s typical day sits under the limits for EVA training.');
    expect(srcText('sample')).toContain('Sample weather');
  });
});
