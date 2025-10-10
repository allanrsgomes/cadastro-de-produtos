import { Timestamp } from '@angular/fire/firestore';

export interface ICategory {
  id: string;
  name: string;
  createdAt: Timestamp;
}
