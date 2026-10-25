import {loginSchema} from '../schema';

describe('auth loginSchema', () => {
  it('accepts and normalizes an email address', () => {
    expect(loginSchema.parse({identifier: ' Learner@Example.COM ', password: 'validpass'})).toEqual({
      identifier: 'learner@example.com',
      password: 'validpass',
    });
  });

  it('accepts the backend minimum password length', () => {
    expect(loginSchema.parse({identifier: 'learner@example.com', password: 'sixsix'}).password).toBe('sixsix');
  });

  it('rejects short passwords and invalid identifiers', () => {
    expect(loginSchema.safeParse({identifier: '123', password: 'short'}).success).toBe(false);
    expect(loginSchema.safeParse({identifier: 'not-an-email', password: 'validpass'}).success).toBe(false);
  });
});
