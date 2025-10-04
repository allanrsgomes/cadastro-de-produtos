import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { INewProductRequest } from '../interfaces/new-product-request';
import { INewProductResponse } from '../interfaces/new-product-response';
import { IProductsResponse } from '../interfaces/products-response';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly firestore = inject(Firestore);
  private readonly productsCollection = collection(this.firestore, 'products');

  saveProduct(product: INewProductRequest): Observable<INewProductResponse> {
    const productData = {
      ...product,
      status: 'Disponível',
      createdAt: Timestamp.now()
    };

    return from(addDoc(this.productsCollection, productData)).pipe(
      map((docRef) => {
        return {
          message: 'Produto cadastrado com sucesso',
          data: [{
            id: docRef.id,
            title: product.title,
            price: product.price,
            description: product.description,
            category: product.category,
            status: 'Disponível',
            imageMain: product.imageMain
          }]
        };
      })
    );
  }

  getProducts(): Observable<IProductsResponse> {
    const q = query(this.productsCollection, orderBy('createdAt', 'desc'));

    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        const products = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data['title'],
            price: data['price'],
            description: data['description'],
            category: data['category'],
            status: data['status'] || 'Disponível',
            imageMain: data['imageMain']
          };
        });

        return {
          message: 'Produtos recuperados com sucesso',
          data: products
        };
      })
    );
  }
}
