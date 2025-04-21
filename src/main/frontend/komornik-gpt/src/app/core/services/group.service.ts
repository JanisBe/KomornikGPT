import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Group} from '../models/group.model';

export interface UpdateGroupRequest {
  name?: string;
  userIds?: number[];
}

export interface CreateGroupRequest {
  name: string;
  members: Array<{
    userId?: number;
    userName: string;
    email: string;
  }>;
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

  createGroup(request: CreateGroupRequest): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, request);
  }

  updateGroup(id: number, request: UpdateGroupRequest): Observable<Group> {
    return this.http.put<Group>(`${this.apiUrl}/${id}`, request);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
