import {queryKeys} from '../src/core/query';
import {toAppError} from '../src/core/api/http';
import {appConfig} from '../src/core/config';

describe('query keys', () => {
  it('include account identity for private data', () => {
    expect(queryKeys.enrollments('user-a')).not.toEqual(queryKeys.enrollments('user-b'));
    expect(queryKeys.search('tally')).toEqual(['search', {q: 'tally', type: undefined, cursor: undefined}]);
  });
});

describe('app capabilities', () => {
  it('keeps live chat disabled in every data mode', () => {
    expect(appConfig.capabilities.liveChat).toBe(false);
  });
});

describe('error mapping', () => {
  it('marks unknown failures as non-access', () => {
    const error = toAppError(new Error('boom'));
    expect(error.retryable).toBe(false);
    expect(error.code).toBe('unknown');
  });
});
