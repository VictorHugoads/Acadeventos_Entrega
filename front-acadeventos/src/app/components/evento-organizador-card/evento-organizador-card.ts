import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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

@Component({
  selector: 'app-evento-organizador-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evento-organizador-card.html',
  styleUrls: ['./evento-organizador-card.scss']
})
export class EventoOrganizadorCard {

  @Input() evento!: Evento;

  @Input() status = '';

  @Input() vagasDisponiveis = 0;

  @Input() inscritos: string[] | null = null;


  @Output() editarClick = new EventEmitter<Evento>();

  @Output() excluirClick = new EventEmitter<Evento>();

  @Output() verInscritosClick = new EventEmitter<Evento>();


  get eventoFinalizado(): boolean {
    return this.status.toLowerCase() === 'finalizado';
  }


  editar(): void {
    this.editarClick.emit(this.evento);
  }


  excluir(): void {
    this.excluirClick.emit(this.evento);
  }


  verInscritos(): void {
    this.verInscritosClick.emit(this.evento);
  }

}