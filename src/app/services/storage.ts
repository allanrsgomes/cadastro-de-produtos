import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private storage: Storage) { }

  uploadImage(file: File, path: string): Observable<string> {
    const storageRef = ref(this.storage, path);

    return from(uploadBytes(storageRef, file)).pipe(
      switchMap((snapshot) => from(getDownloadURL(snapshot.ref)))
    );
  }

  generateImagePath(fileName: string): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    return `products/${timestamp}.${extension}`;
  }
}
