import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Usuario {
  _id?: string;
  username: string;
  isOrganizer: Boolean;
}

export interface LoginResponse {
  ok: boolean;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})

export class UsuarioService{
    private apiUrl = 'http://localhost:3000';

    constructor(private http: HttpClient) {}

    criarUsuario(usuario: Usuario): Observable<Usuario> {
        return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, usuario);
    }

    logarUsuario(username: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/usuarios/login`, { username });
    }

}