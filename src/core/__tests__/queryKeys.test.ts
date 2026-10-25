import {queryKeys} from '../query';

describe('queryKeys', () => {
  it('scopes private collections by account', () => {
    expect(queryKeys.enrollments('user-a')).not.toEqual(queryKeys.enrollments('user-b'));
  });

  it('keeps search keys stable', () => {
    expect(queryKeys.search('tally')).toEqual(['search', {q: 'tally', type: undefined, cursor: undefined}]);
  });
});
