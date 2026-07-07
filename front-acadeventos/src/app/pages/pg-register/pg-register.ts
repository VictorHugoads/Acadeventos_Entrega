import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Usuario, UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-pg-register',
  imports: [FormsModule],
  templateUrl: './pg-register.html',
  styleUrl: './pg-register.scss',
})
export class PgRegister {
  nome = '';

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  cadastrarComoParticipante() {
    this.cadastrar(false);
  }

  cadastrarComoOrganizador() {
    this.cadastrar(true);
  }

  private cadastrar(isOrganizer: boolean) {
    const novoUsuario: Usuario = {
      username: this.nome,
      isOrganizer
    };

    this.usuarioService.criarUsuario(novoUsuario).subscribe({
      next: (usuarioCriado) => {
        alert(`Usuário "${usuarioCriado.username}" criado com sucesso!`);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 409) {
          alert('Já existe um usuário com esse nome.');
        } else {
          alert('Erro ao criar usuário: ' + err.message);
        }
      }
    });
  }

  irParaLogin() {
    this.router.navigate(['/login']);
  }
}
