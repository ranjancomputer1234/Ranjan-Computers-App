import {createContext, useContext} from 'react';
import {createHttpRepositories} from './api/httpRepositories';
import type {Repositories} from './repositories';

export const repositories: Repositories = createHttpRepositories();

export const RepositoryContext = createContext<Repositories>(repositories);

export function useRepositories(): Repositories {
  return useContext(RepositoryContext);
}
