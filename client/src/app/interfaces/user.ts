import { Group } from './group';

export interface User {
  _id: string,
  bnet: {
    id: number,
    battletag: string,
    regions: [string],
    personalCharacters: [
      {
        name: string,
        realm: string,
        region: string,
        thumbnail: string,
        guild: string,
        guildRealm: string,
        lastModified: number
      }
    ]
  },
  dateSignedUp: Date,
  image: string,
  groups: {
    personal: [Group],
    favorites: [Group]
  }
}