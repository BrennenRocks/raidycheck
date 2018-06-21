import { Group } from './group';

export interface User {
  _id: string,
  bnet: {
    id: number,
    battletag: string,
    regions: [string],
    personalCharacters: any[]
  },
  dateSignedUp: Date,
  image: string,
  groups: {
    personal: [Group],
    favorites: [Group]
  }
}