import { Character } from './character';

export interface Group {
  _id: string,
  title: string,
  owner: string,
  favoritesCount: number,
  favoritedBy: [string],
  isPublic: boolean,
  allowOthersToUpdateCharacters: boolean,
  characters: [Character]
}