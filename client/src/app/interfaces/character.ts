export interface Character {
  _id: string,
  cid: {
    name: string,
    realm: string,
    region: string
  },
  faction: number,
  lastModified: number,
  iLvl: number,
  class: number,
  thumbnail: string,
  lastUpdated: Date,
  items: [
    {
      slot: string,
      id: number,
      name: string,
      icon: string,
      iLvl: number,
      quality: number,
      bonusLists: [number],
      tooltipParams: object
    }
  ],
  raids: [{
    name: string,
    lfr: number,
    normal: number,
    heroic: number,
    mythic: number,
    id: number,
    bosses: [{
      id: number,
      lfrKills: number,
      lfrTimestamp: number,
      normalKills: number,
      normalTimestamp: number,
      heroicKills: number,
      heroicTimestamp: number,
      mythicKills: number,
      mythicTimestamp: number
    }]
  }]
}