import {isPublishedResult} from '../src/core/api/resultPublication';

describe('published results', () => {
  it('hides an attempt whose result has not been released', () => {
    expect(isPublishedResult({status: 'result_unpublished', resultPublished: false, score: 0})).toBe(false);
    expect(isPublishedResult({status: 'unpublished'})).toBe(false);
    expect(isPublishedResult({published: false, status: 'scored'})).toBe(false);
  });

  it('keeps a released score', () => {
    expect(isPublishedResult({status: 'scored', resultPublished: true, score: 18})).toBe(true);
    expect(isPublishedResult({status: 'submitted', score: 12, maxScore: 20})).toBe(true);
  });
});
