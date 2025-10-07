import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { INewProductRequest } from '../interfaces/new-product-request';
import { INewProductResponse } from '../interfaces/new-product-response';
import { IProductsResponse } from '../interfaces/products-response';
import { IProductResponse } from '../interfaces/product-response';

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

  getProductById(productId: string): Observable<IProductResponse> {
    const productDoc = doc(this.firestore, 'products', productId);

    return from(getDoc(productDoc)).pipe(
      map((docSnapshot) => {
        if (!docSnapshot.exists()) {
          throw new Error('Produto não encontrado');
        }

        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          title: data['title'],
          price: data['price'],
          description: data['description'],
          category: data['category'],
          status: data['status'] || 'anunciado',
          imageMain: data['imageMain'],
          images: data['images'] || [data['images']]
        };
      })
    );
  }

  updateProduct(productId: string, updates: Partial<INewProductRequest>): Observable<void> {
    const productDoc = doc(this.firestore, 'products', productId);

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(productDoc, updateData));
  }

  updateProductStatus(productId: string, status: string): Observable<void> {
    const productDoc = doc(this.firestore, 'products', productId);

    return from(updateDoc(productDoc, {
      status: status.toLowerCase(),
      updatedAt: Timestamp.now()
    }));
  }

  deleteProduct(productId: string): Observable<void> {
    const productDoc = doc(this.firestore, 'products', productId);
    return from(deleteDoc(productDoc));
  }

  getProductsByCategory(category: string): Observable<IProductsResponse> {
    const q = query(
      this.productsCollection,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );

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
            status: data['status'] || 'anunciado',
            imageMain: data['imageMain'],
            images: data['images']
          };
        });

        return {
          message: 'Produtos recuperados com sucesso',
          data: products
        };
      })
    );
  }

  getProductsByStatus(status: string): Observable<IProductsResponse> {
    const q = query(
      this.productsCollection,
      where('status', '==', status.toLowerCase()),
      orderBy('createdAt', 'desc')
    );

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
            status: data['status'] || 'anunciado',
            imageMain: data['imageMain'],
            images: data['images']
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
