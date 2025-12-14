
export enum EditMode {
  General = 'General',
  TryOn = 'TryOn',
  Inpainting = 'Inpainting',
  Outpainting = 'Outpainting',
}

export interface ImageFile {
  file: File;
  base64: string;
}
