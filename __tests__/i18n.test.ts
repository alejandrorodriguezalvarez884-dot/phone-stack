describe('translations', () => {
  const load = (languageCode: string) => {
    jest.resetModules();
    jest.doMock('expo-localization', () => ({ getLocales: () => [{ languageCode }] }));
    return require('../src/i18n').t;
  };

  it('picks Spanish for Spanish devices and English otherwise', () => {
    expect(load('es').createTable).toBe('Crear mesa');
    expect(load('en').createTable).toBe('Create table');
    expect(load('fr').createTable).toBe('Create table');
  });

  it('has the same penalties and steps in both languages', () => {
    const es = load('es');
    const en = load('en');
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    expect(es.penalties).toHaveLength(en.penalties.length);
    expect(es.howSteps).toHaveLength(en.howSteps.length);
  });
});
