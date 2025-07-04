export interface Certificate {
  name: string;
  id: string;
  serial: string;
  date: string;
  owner: string;
  metadata: string[];
}

export interface CertificateResult {
  certificate: Certificate;
  msgHash: string;
  qrData: string;
  verificationResult: boolean;
  error?: string;
}

export interface ManufacturerDetails {
  manufacturer_name: string;
  manufacturer_address: string;
  is_registered: boolean;
  registered_at: string;
}

export interface UserDetails {
  user_address: string;
  username: string;
  is_registered: boolean;
  registered_at: string;
}

export interface ItemDetails {
  name: string;
  item_id: string;
  serial: string;
  owner: string;
  manufacturer: string;
  date: string;
  metadata_hash: string;
}

export interface OwnershipDetails {
  name: string;
  item_id: string;
  username: string;
  owner: string;
}

export enum ContractType {
  VIEW = "view",
  STATE_CHANGE = "state_change"
}