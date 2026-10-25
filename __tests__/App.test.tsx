/**
 * @format
 */
import {queryKeys} from '../src/core/query';

test('home keys differ by account', () => {
  expect(queryKeys.home('guest')).not.toEqual(queryKeys.home('user-a'));
});
