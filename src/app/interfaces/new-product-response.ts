export interface INewProductResponse {
  message: string;
  data: {
    id: string;
    title: string;
    price: number;
    description: string;
    category: string;
    status: string;
    imageMain: string;
  }[];
}
