import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Group} from '../models/group.model';

export interface UpdateGroupRequest {
  name?: string;
  userIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = '/api/groups';

  constructor(private http: HttpClient) {
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiUrl);
  }

  getGroup(id: number): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${id}`);
  }

  createGroup(group: Partial<Group>): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, group);
  }

  updateGroup(id: number, request: UpdateGroupRequest): Observable<Group> {
    return this.http.put<Group>(`${this.apiUrl}/${id}`, request);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
