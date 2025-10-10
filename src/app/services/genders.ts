import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, Timestamp } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IGender } from '../interfaces/gender';

@Injectable({
  providedIn: 'root'
})
export class GendersService {
  private readonly firestore = inject(Firestore);
  private readonly gendersCollection = collection(this.firestore, 'genders');

  /**
   * Busca todos os gêneros
   */
  getGenders(): Observable<IGender[]> {
    return from(getDocs(this.gendersCollection)).pipe(
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
   * Adiciona um novo gênero
   */
  addGender(name: string): Observable<string> {
    return from(addDoc(this.gendersCollection, {
      name: name.trim(),
      createdAt: Timestamp.now()
    })).pipe(
      map((docRef) => docRef.id)
    );
  }
}
