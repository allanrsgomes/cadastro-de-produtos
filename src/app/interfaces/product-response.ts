export interface IProductResponse {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  gender?: string;
  status: string;
  imageMain: string;
  images?: string[];
}
