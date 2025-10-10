import { Timestamp } from '@angular/fire/firestore';

export interface IGender {
  id: string;
  name: string;
  createdAt: Timestamp;
}
