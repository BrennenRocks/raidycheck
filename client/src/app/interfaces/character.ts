export interface Character {
  _id: string,
  cid: {
    name: string,
    realm: string,
    region: string
  },
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
  raids: [Object]
}