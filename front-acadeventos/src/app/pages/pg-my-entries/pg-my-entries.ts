import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Evento {
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
  selector: 'app-pg-my-entries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pg-my-entries.html'
})
export class PgMyEntries implements OnInit {
  private apiUrl = 'http://localhost:3000';

  usuarioNome = localStorage.getItem('usuarioNome') || 'Victor';
  usuarioPerfil = localStorage.getItem('usuarioPerfil') || 'participante';

  eventos: Evento[] = [];

  carregando = false;
  erro = '';
  sucesso = '';

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarMinhasInscricoes();
  }

  async carregarMinhasInscricoes(): Promise<void> {
    this.carregando = true;
    this.erro = '';
    this.sucesso = '';
    this.atualizarTela();

    try {
      const participante = this.usuarioNome.toLowerCase();
      const url = `${this.apiUrl}/inscricoes/${participante}`;

      console.log('Buscando minhas inscrições em:', url);

      const resposta = await this.fetchComTimeout(url, 10000);

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.error || `Erro HTTP ${resposta.status}`);
      }

      console.log('Minhas inscrições recebidas:', dados);

      if (Array.isArray(dados)) {
        this.eventos = dados;
      } else if (Array.isArray(dados?.eventos)) {
        this.eventos = dados.eventos;
      } else if (Array.isArray(dados?.data)) {
        this.eventos = dados.data;
      } else {
        this.eventos = [];
      }
    } catch (err: any) {
      console.error('Erro ao carregar minhas inscrições:', err);
      this.erro = 'Erro ao carregar minhas inscrições: ' + (err?.message || 'erro inesperado.');
      this.eventos = [];
    } finally {
      this.carregando = false;
      this.atualizarTela();
    }
  }

  async cancelarInscricao(evento: Evento): Promise<void> {
    if (!evento._id) {
      return;
    }

    const confirmar = confirm(`Deseja cancelar sua inscrição no evento "${evento.titulo}"?`);

    if (!confirmar) {
      return;
    }

    try {
      const resposta = await this.fetchComTimeout(
        `${this.apiUrl}/eventos/${evento._id}/cancelar-inscricao`,
        10000,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            participante: this.usuarioNome.toLowerCase()
          })
        }
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.error || `Erro HTTP ${resposta.status}`);
      }

      this.sucesso = 'Inscrição cancelada com sucesso.';
      await this.carregarMinhasInscricoes();
    } catch (err: any) {
      console.error('Erro ao cancelar inscrição:', err);
      this.erro = 'Erro ao cancelar inscrição: ' + (err?.message || 'erro inesperado.');
      this.atualizarTela();
    }
  }

  get eventosFuturos(): Evento[] {
    return this.eventos.filter(evento => this.statusEvento(evento) === 'Futuro');
  }

  get eventosOcorrendo(): Evento[] {
    return this.eventos.filter(evento => this.statusEvento(evento) === 'Ocorrendo');
  }

  get eventosFinalizados(): Evento[] {
    return this.eventos.filter(evento => this.statusEvento(evento) === 'Finalizado');
  }

  statusEvento(evento: Evento): string {
    if (evento.status) {
      return this.formatarStatus(evento.status);
    }

    const agora = new Date();
    const dataEvento = new Date(evento.dataHora);

    if (Number.isNaN(dataEvento.getTime())) {
      return 'Sem data';
    }

    if (dataEvento > agora) {
      return 'Futuro';
    }

    const duasHorasDepois = new Date(dataEvento.getTime() + 2 * 60 * 60 * 1000);

    if (agora >= dataEvento && agora <= duasHorasDepois) {
      return 'Ocorrendo';
    }

    return 'Finalizado';
  }

  eventoFinalizado(evento: Evento): boolean {
    return this.statusEvento(evento) === 'Finalizado';
  }

  vagasDisponiveis(evento: Evento): number {
    if (typeof evento.vagasDisponiveis === 'number') {
      return evento.vagasDisponiveis;
    }

    const totalInscritos = evento.inscritos?.length || 0;
    return Math.max(evento.vagas - totalInscritos, 0);
  }

  voltarParaHome(): void {
    this.router.navigate(['/homepage']);
  }

  sair(): void {
    localStorage.removeItem('usuarioNome');
    localStorage.removeItem('usuarioPerfil');
    this.router.navigate(['/login']);
  }

  trackByEventoId(index: number, evento: Evento): string {
    return evento._id || String(index);
  }

  private formatarStatus(status: string): string {
    const statusNormalizado = status.toLowerCase();

    if (statusNormalizado === 'futuro') {
      return 'Futuro';
    }

    if (statusNormalizado === 'ocorrendo') {
      return 'Ocorrendo';
    }

    if (statusNormalizado === 'finalizado') {
      return 'Finalizado';
    }

    return status;
  }

  private async fetchComTimeout(
    url: string,
    tempo: number,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, tempo);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private atualizarTela(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
}