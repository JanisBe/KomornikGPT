export interface WebAuthnCredentialDto {
  id: number;
  credentialId: string;
  label: string;
  created: string;
  lastUsed?: string;
}
