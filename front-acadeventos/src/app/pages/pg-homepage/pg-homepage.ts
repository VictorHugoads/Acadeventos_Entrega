import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventoParticipanteCard } from '../../components/evento-participante-card/evento-participante-card';
import { EventoOrganizadorCard } from '../../components/evento-organizador-card/evento-organizador-card';

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
  selector: 'app-pg-homepage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EventoParticipanteCard,
    EventoOrganizadorCard
  ],
  templateUrl: './pg-homepage.html'
})
export class PgHomepage implements OnInit {
  private apiUrl = 'http://localhost:3000';

  usuarioNome = localStorage.getItem('usuarioNome') || 'Victor';
  usuarioPerfil = localStorage.getItem('usuarioPerfil') || 'participante';

  eventos: Evento[] = [];

  texto = '';
  categoria = '';
  ordenar = '';

  carregando = false;
  salvando = false;

  erro = '';
  sucesso = '';

  mostrarFormulario = false;
  editando = false;
  eventoEditandoId = '';

  inscritosPorEvento: Record<string, string[]> = {};

  eventoForm: Evento = {
    titulo: '',
    descricao: '',
    dataHora: '',
    local: '',
    categoria: '',
    vagas: 1,
    imagem: '',
    organizador: this.usuarioNome.toLowerCase(),
    inscritos: []
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('PG HOMEPAGE CARREGOU');
    this.carregarEventos();
  }

  get ehOrganizador(): boolean {
    return this.usuarioPerfil === 'organizador';
  }

  async carregarEventos(): Promise<void> {
    this.carregando = true;
    this.erro = '';
    this.sucesso = '';
    this.atualizarTela();

    try {
      const params = new URLSearchParams();

      if (this.texto.trim()) {
        params.set('texto', this.texto.trim());
      }

      if (this.categoria) {
        params.set('categoria', this.categoria);
      }

      if (this.ordenar) {
        params.set('ordenar', this.ordenar);
      }

      const query = params.toString();
      const url = query ? `${this.apiUrl}/eventos?${query}` : `${this.apiUrl}/eventos`;

      console.log('Buscando eventos em:', url);

      const resposta = await this.fetchComTimeout(url, 10000);

      if (!resposta.ok) {
        throw new Error(`Erro HTTP ${resposta.status}`);
      }

      const dados = await resposta.json();

      console.log('Eventos recebidos da API:', dados);

      if (Array.isArray(dados)) {
        this.eventos = dados;
      } else if (Array.isArray(dados?.eventos)) {
        this.eventos = dados.eventos;
      } else if (Array.isArray(dados?.data)) {
        this.eventos = dados.data;
      } else {
        this.eventos = [];
      }

      console.log('Eventos colocados na tela:', this.eventos);
    } catch (err: any) {
      console.error('Erro ao carregar eventos:', err);
      this.erro = 'Erro ao carregar eventos: ' + (err?.message || 'erro inesperado.');
      this.eventos = [];
    } finally {
      this.carregando = false;
      this.atualizarTela();
    }
  }

  limparFiltros(): void {
    this.texto = '';
    this.categoria = '';
    this.ordenar = '';
    this.carregarEventos();
  }

  abrirFormularioNovo(): void {
    this.mostrarFormulario = true;
    this.editando = false;
    this.eventoEditandoId = '';
    this.limparFormulario();
    this.atualizarTela();
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.eventoEditandoId = '';
    this.limparFormulario();
    this.atualizarTela();
  }

  async salvarEvento(): Promise<void> {
    if (
      !this.eventoForm.titulo.trim() ||
      !this.eventoForm.descricao.trim() ||
      !this.eventoForm.dataHora ||
      !this.eventoForm.local.trim() ||
      !this.eventoForm.categoria.trim() ||
      !this.eventoForm.vagas
    ) {
      this.erro = 'Preencha todos os campos obrigatórios.';
      this.atualizarTela();
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.sucesso = '';
    this.atualizarTela();

    const eventoParaSalvar: Evento = {
      titulo: this.eventoForm.titulo.trim(),
      descricao: this.eventoForm.descricao.trim(),
      dataHora: this.eventoForm.dataHora,
      local: this.eventoForm.local.trim(),
      categoria: this.eventoForm.categoria.trim(),
      vagas: Number(this.eventoForm.vagas),
      imagem: this.eventoForm.imagem?.trim() || '',
      organizador: this.usuarioNome.toLowerCase(),
      inscritos: this.eventoForm.inscritos || []
    };

    try {
      const url = this.editando && this.eventoEditandoId
        ? `${this.apiUrl}/eventos/${this.eventoEditandoId}`
        : `${this.apiUrl}/eventos`;

      const metodo = this.editando && this.eventoEditandoId ? 'PUT' : 'POST';

      const resposta = await this.fetchComTimeout(url, 10000, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventoParaSalvar)
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.error || `Erro HTTP ${resposta.status}`);
      }

      this.sucesso = this.editando
        ? 'Evento atualizado com sucesso.'
        : 'Evento criado com sucesso.';

      this.cancelarFormulario();
      await this.carregarEventos();
    } catch (err: any) {
      console.error('Erro ao salvar evento:', err);
      this.erro = 'Erro ao salvar evento: ' + (err?.message || 'erro inesperado.');
    } finally {
      this.salvando = false;
      this.atualizarTela();
    }
  }

  editarEvento(evento: Evento): void {
    if (!evento._id) {
      return;
    }

    if (this.eventoFinalizado(evento)) {
      this.erro = 'Evento finalizado não pode ser editado.';
      this.atualizarTela();
      return;
    }

    this.mostrarFormulario = true;
    this.editando = true;
    this.eventoEditandoId = evento._id;

    this.eventoForm = {
      _id: evento._id,
      titulo: evento.titulo,
      descricao: evento.descricao,
      dataHora: this.formatarDataParaInput(evento.dataHora),
      local: evento.local,
      categoria: evento.categoria,
      vagas: evento.vagas,
      imagem: evento.imagem || '',
      organizador: evento.organizador,
      inscritos: evento.inscritos || []
    };

    this.atualizarTela();
  }

  async excluirEvento(evento: Evento): Promise<void> {
    if (!evento._id) {
      return;
    }

    if (this.eventoFinalizado(evento)) {
      this.erro = 'Evento finalizado não pode ser excluído.';
      this.atualizarTela();
      return;
    }

    const confirmar = confirm(`Deseja excluir o evento "${evento.titulo}"?`);

    if (!confirmar) {
      return;
    }

    try {
      const resposta = await this.fetchComTimeout(`${this.apiUrl}/eventos/${evento._id}`, 10000, {
        method: 'DELETE'
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.error || `Erro HTTP ${resposta.status}`);
      }

      this.sucesso = 'Evento excluído com sucesso.';
      await this.carregarEventos();
    } catch (err: any) {
      console.error('Erro ao excluir evento:', err);
      this.erro = 'Erro ao excluir evento: ' + (err?.message || 'erro inesperado.');
      this.atualizarTela();
    }
  }

  async inscrever(evento: Evento): Promise<void> {
    if (!evento._id) {
      return;
    }

    if (this.eventoFinalizado(evento)) {
      this.erro = 'Não é possível se inscrever em evento finalizado.';
      this.atualizarTela();
      return;
    }

    try {
      const resposta = await this.fetchComTimeout(`${this.apiUrl}/eventos/${evento._id}/inscrever`, 10000, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participante: this.usuarioNome.toLowerCase()
        })
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.error || `Erro HTTP ${resposta.status}`);
      }

      this.sucesso = 'Inscrição realizada com sucesso.';
      await this.carregarEventos();
    } catch (err: any) {
      console.error('Erro ao realizar inscrição:', err);
      this.erro = 'Erro ao realizar inscrição: ' + (err?.message || 'erro inesperado.');
      this.atualizarTela();
    }
  }

  async cancelarInscricao(evento: Evento): Promise<void> {
    if (!evento._id) {
      return;
    }

    try {
      const resposta = await this.fetchComTimeout(`${this.apiUrl}/eventos/${evento._id}/cancelar-inscricao`, 10000, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participante: this.usuarioNome.toLowerCase()
        })
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.error || `Erro HTTP ${resposta.status}`);
      }

      this.sucesso = 'Inscrição cancelada com sucesso.';
      await this.carregarEventos();
    } catch (err: any) {
      console.error('Erro ao cancelar inscrição:', err);
      this.erro = 'Erro ao cancelar inscrição: ' + (err?.message || 'erro inesperado.');
      this.atualizarTela();
    }
  }

  estaInscrito(evento: Evento): boolean {
    const usuario = this.usuarioNome.toLowerCase();
    return evento.inscritos?.includes(usuario) || false;
  }

  async verInscritos(evento: Evento): Promise<void> {
    if (!evento._id) {
      return;
    }

    try {
      const resposta = await this.fetchComTimeout(`${this.apiUrl}/eventos/${evento._id}/inscritos`, 10000);

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados?.error || `Erro HTTP ${resposta.status}`);
      }

      this.inscritosPorEvento[evento._id] = dados.inscritos || [];
      this.atualizarTela();
    } catch (err: any) {
      console.error('Erro ao buscar inscritos:', err);
      this.erro = 'Erro ao buscar inscritos: ' + (err?.message || 'erro inesperado.');
      this.atualizarTela();
    }
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
    return this.statusEvento(evento).toLowerCase() === 'finalizado';
  }

  vagasDisponiveis(evento: Evento): number {
    if (typeof evento.vagasDisponiveis === 'number') {
      return evento.vagasDisponiveis;
    }

    const totalInscritos = evento.inscritos?.length || 0;
    return Math.max(evento.vagas - totalInscritos, 0);
  }

  irParaMinhasInscricoes(): void {
    this.router.navigate(['/my-entries']);
  }

  sair(): void {
    localStorage.removeItem('usuarioNome');
    localStorage.removeItem('usuarioPerfil');
    this.router.navigate(['/login']);
  }

  trackByEventoId(index: number, evento: Evento): string {
    return evento._id || String(index);
  }

  private limparFormulario(): void {
    this.eventoForm = {
      titulo: '',
      descricao: '',
      dataHora: '',
      local: '',
      categoria: '',
      vagas: 1,
      imagem: '',
      organizador: this.usuarioNome.toLowerCase(),
      inscritos: []
    };
  }

  private formatarDataParaInput(dataHora: string): string {
    const data = new Date(dataHora);

    if (Number.isNaN(data.getTime())) {
      return '';
    }

    const dataLocal = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return dataLocal.toISOString().slice(0, 16);
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