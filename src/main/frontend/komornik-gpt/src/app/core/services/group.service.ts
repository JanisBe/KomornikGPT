import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Group} from '../models/group.model';
import {environment} from '../../../environments/environment';
import {Expense} from '../models/expense.model';

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  members: {
    userId?: number;
    userName: string;
    email: string;
  }[];
}

export interface CreateGroupRequest {
  name: string;
  members: {
    userId?: number;
    userName: string;
    email: string;
  }[];
}

interface GroupResponse {
  id: number;
  name: string;
  users: {
    id: number;
    username: string;
    email: string;
    name: string;
    surname: string;
    role: string;
  }[];
  expenses?: Expense[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id: number;
    username: string;
    email: string;
    name: string;
    surname: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly apiUrl = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) {
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<GroupResponse[]>(this.apiUrl).pipe(
      map(groups => groups.map(group => this.mapGroupResponse(group)))
    );
  }

  getGroup(id: number): Observable<Group> {
    return this.http.get<GroupResponse>(`${this.apiUrl}/${id}`).pipe(
      map(group => this.mapGroupResponse(group))
    );
  }

  createGroup(request: CreateGroupRequest): Observable<Group> {
    return this.http.post<GroupResponse>(this.apiUrl, request).pipe(
      map(group => this.mapGroupResponse(group))
    );
  }

  updateGroup(id: number, request: UpdateGroupRequest): Observable<Group> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, request).pipe(
      map(group => this.mapGroupResponse(group))
    );
  }

  getMyGroups(): Observable<Group[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my`).pipe(
      map(groups => groups.map(group => this.mapGroupResponse(group)))
    );
  }

  private mapGroupResponse(group: any): Group {
    return {
      ...group,
      members: group.members ?? group.users ?? [],
      createdAt: group.createdAt ? new Date(group.createdAt) : undefined,
      updatedAt: group.updatedAt ? new Date(group.updatedAt) : undefined,
      isPublic: (group as any).isPublic ?? (group as any).is_public ?? false
    };
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
