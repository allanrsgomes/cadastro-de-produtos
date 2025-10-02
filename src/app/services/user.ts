import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly auth = inject(Auth);

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map((userCredential) => {
        return {
          message: 'Login realizado com sucesso',
          data: {
            token: userCredential.user.uid,
            user: {
              id: userCredential.user.uid,
              email: userCredential.user.email
            }
          }
        };
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  validateUser(): Observable<any> {
    return new Observable((observer) => {
      const unsubscribe = onAuthStateChanged(this.auth,
        (user) => {
          if (user) {
            observer.next({
              message: 'Usuário autenticado',
              user: {
                userId: user.uid,
                email: user.email,
                iat: 0,
                exp: 0
              }
            });
            observer.complete();
          } else {
            observer.error({ message: 'Usuário não autenticado' });
          }
          unsubscribe();
        },
        (error) => {
          observer.error(error);
          unsubscribe();
        }
      );
    });
  }
}
