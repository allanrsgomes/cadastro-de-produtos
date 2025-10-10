import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, Timestamp } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICategory } from '../interfaces/category';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly firestore = inject(Firestore);
  private readonly categoriesCollection = collection(this.firestore, 'categories');

  /**
   * Busca todas as categorias
   */
  getCategories(): Observable<ICategory[]> {
    return from(getDocs(this.categoriesCollection)).pipe(
      map((querySnapshot) => {
        return querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data['name'],
            createdAt: data['createdAt']
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  /**
   * Adiciona uma nova categoria
   */
  addCategory(name: string): Observable<string> {
    return from(addDoc(this.categoriesCollection, {
      name: name.trim(),
      createdAt: Timestamp.now()
    })).pipe(
      map((docRef) => docRef.id)
    );
  }
}
