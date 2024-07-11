// interfaces.ts

export interface AddressAttributes {
  OBJECTID: number;
  NUMBER_COMPLETE: string;
  UNIT_NUMBER_COMPLETE: string | null;
  STREET_NAME: string;
  STREET_SUFFIX_TYPE: string;
  STREET_SUFFIX_DIRECTION: string | null;
  FULL_STREET_NAME: string;
  SETTLEMENT: string | null;
  COMMUNITY: string;
  MUNICIPALITY: string;
  PROVINCE: string;
  COUNTRY: string;
  POSTAL_CODE: string;
}

export interface AddressFeature {
  attributes: AddressAttributes;
  geometry: {
    x: number;
    y: number;
  };
}

export interface AddressResponse {
  features: AddressFeature[];
}
