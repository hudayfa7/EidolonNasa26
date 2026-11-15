// esc: engine text (country names, summaries) on its way into innerHTML or a double-quoted attribute.
import { describe, expect, it } from 'vitest';
import { esc } from './dom';

describe('esc', () => {
  it('turns markup and attribute breakers into character references, nothing else', () => {
    expect(esc('<img src=x onerror="a()"> & co')).toBe('&#60;img src=x onerror=&#34;a()&#34;&#62; &#38; co');
    expect(esc('Côte d’Ivoire, 34.6750° N')).toBe('Côte d’Ivoire, 34.6750° N');
    expect(esc('&#60;')).toBe('&#38;#60;');   // already-escaped text stays text
  });
});
