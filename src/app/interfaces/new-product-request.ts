export interface INewProductRequest {
  title: string;
  price: number;
  description: string;
  category: string;
  imageMain: string;
  images?: string[];
}

export interface ImagePreview {
  file: File;
  preview: string;
  index: number;
}
