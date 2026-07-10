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
  selector: 'app-evento-participante-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evento-participante-card.html',
  styleUrls: ['./evento-participante-card.scss']
})
export class EventoParticipanteCard {

  @Input() evento!: Evento;

  @Input() inscrito = false;

  @Input() status = '';

  @Input() vagasDisponiveis = 0;


  @Output() inscreverClick = new EventEmitter<Evento>();

  @Output() cancelarClick = new EventEmitter<Evento>();


  inscrever() {
    this.inscreverClick.emit(this.evento);
  }


  cancelar() {
    this.cancelarClick.emit(this.evento);
  }

}