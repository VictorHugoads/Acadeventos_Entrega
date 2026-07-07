import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Evento {
  _id?: string;
  titulo: string;
  descricao: string;
  dataHora: string;
  local: string;
  categoria: string;
  vagas: number;
  imagem?: string;
  organizador: string;
  inscritos?: string[];
  status?: string;
  vagasDisponiveis?: number;
  totalInscritos?: number;
}

export interface InscritosEvento {
  evento: string;
  totalInscritos: number;
  inscritos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  listarEventos(
    texto?: string,
    categoria?: string,
    ordenar?: string,
    organizador?: string
  ): Observable<Evento[]> {
    let params = new HttpParams();

    if (texto) {
      params = params.set('texto', texto);
    }

    if (categoria) {
      params = params.set('categoria', categoria);
    }

    if (ordenar) {
      params = params.set('ordenar', ordenar);
    }

    if (organizador) {
      params = params.set('organizador', organizador);
    }

    return this.http.get<Evento[]>(`${this.apiUrl}/eventos`, { params });
  }

  buscarPorId(id: string): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/eventos/${id}`);
  }

  criarEvento(evento: Evento): Observable<Evento> {
    return this.http.post<Evento>(`${this.apiUrl}/eventos`, evento);
  }

  editarEvento(id: string, evento: Partial<Evento>): Observable<Evento> {
    return this.http.put<Evento>(`${this.apiUrl}/eventos/${id}`, evento);
  }

  excluirEvento(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eventos/${id}`);
  }

  inscrever(id: string, participante: string): Observable<Evento> {
    return this.http.post<Evento>(`${this.apiUrl}/eventos/${id}/inscrever`, {
      participante
    });
  }

  cancelarInscricao(id: string, participante: string): Observable<Evento> {
    return this.http.post<Evento>(`${this.apiUrl}/eventos/${id}/cancelar-inscricao`, {
      participante
    });
  }

  minhasInscricoes(participante: string): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/inscricoes/${participante}`);
  }

  listarInscritos(id: string): Observable<InscritosEvento> {
    return this.http.get<InscritosEvento>(`${this.apiUrl}/eventos/${id}/inscritos`);
  }
}