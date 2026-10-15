import { CODE_LENGTH, normalizeCode, randomCode } from '../src/room';

jest.mock('firebase/app', () => ({}));
jest.mock('firebase/database', () => ({}));

describe('table codes', () => {
  it('generates codes from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = randomCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    }
  });

  it('normalizes typed codes', () => {
    expect(normalizeCode('ab-c d')).toBe('ABCD');
    expect(normalizeCode('abcdef')).toBe('ABCD');
    expect(normalizeCode('ñ1x')).toBe('1X');
  });

  it('produces codes the database rules accept', () => {
    expect(randomCode()).toMatch(/^[A-Z0-9]{4}$/);
  });
});
